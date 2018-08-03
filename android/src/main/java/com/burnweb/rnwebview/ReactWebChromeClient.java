package com.burnweb.rnwebview;

import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.util.Log;

import android.content.pm.ActivityInfo;
import android.app.Activity;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.widget.FrameLayout;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.build.ReactBuildConfig;

import static android.view.ViewGroup.LayoutParams;

/**
 * Wrapper Client for {@link WebChromeClient}. It overrides methods for geolocation permissions,
 * console messages (which were previously overwritten ad hoc in {@link ReactWebViewManager}) and
 * onShowCustomView and onHideCustomView for handling fullscreen view
 */
public class ReactWebChromeClient extends WebChromeClient {

  private final FrameLayout.LayoutParams FULLSCREEN_LAYOUT_PARAMS = new FrameLayout.LayoutParams(
          LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT, Gravity.CENTER);

  private WebChromeClient.CustomViewCallback mCustomViewCallback;
  private View mFullScreenView;
  private ReactContext mReactContext;

  public ReactWebChromeClient(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  @Override
  public boolean onCreateWindow(WebView view, boolean dialog, boolean userGesture, android.os.Message resultMsg) {
      String data = view.getHitTestResult().getExtra();
      if (data != null) {
          Uri uri = Uri.parse(data);
          view.getContext().startActivity(new Intent(Intent.ACTION_VIEW, uri));
      } else {
          Log.e("RNWebView", "WebView tried to open a link in new window but did not provide URL, ignoring...");
      }

      return false;
  }

  @Override
  public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
      getModule().showAlert(url, message, result);
      return true;
  }

  // For Android 4.1+
  @SuppressWarnings("unused")
  public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType, String capture) {
      getModule().startFileChooserIntent(uploadMsg, acceptType);
  }

  // For Android 5.0+
  @SuppressLint("NewApi")
  public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
      return getModule().startFileChooserIntent(filePathCallback, fileChooserParams.createIntent());
  }

  @Override
  public boolean onConsoleMessage(ConsoleMessage message) {
    if (ReactBuildConfig.DEBUG) {
      return super.onConsoleMessage(message);
    }
    // Ignore console logs in non debug builds.
    return true;
  }

  @Override
  public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
    callback.invoke(origin, true, false);
  }

  @Override
  public void onShowCustomView(View view, CustomViewCallback callback) {
    if (mFullScreenView != null) {
      callback.onCustomViewHidden();
      return;
    }

    view.setSystemUiVisibility(View.STATUS_BAR_HIDDEN);

    // Store the view for hiding handling
    mFullScreenView = view;
    mCustomViewCallback = callback;
    view.setBackgroundColor(Color.BLACK);
    getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);
    getRootView().addView(view, FULLSCREEN_LAYOUT_PARAMS);

  }

  @Override
  public void onHideCustomView() {
    if (mFullScreenView == null) {
      return;
    }
    getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
    mFullScreenView.setVisibility(View.GONE);
    getRootView().removeView(mFullScreenView);
    mFullScreenView = null;
    mCustomViewCallback.onCustomViewHidden();
  }

  private ViewGroup getRootView() {
    return ((ViewGroup) mReactContext.getCurrentActivity().findViewById(android.R.id.content));
  }

  private Activity getActivity() {
    return mReactContext.getCurrentActivity();
  }
}
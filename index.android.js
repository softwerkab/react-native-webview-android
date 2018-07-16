/**
 * @providesModule WebViewAndroid
 */
'use strict';

var React = require('react');
var RN = require("react-native");
var createClass = require('create-react-class');
var PropTypes = require('prop-types');

var { requireNativeComponent, NativeModules, StyleSheet, ActivityIndicator, View } = require('react-native');
var RCTUIManager = NativeModules.UIManager;

var WEBVIEW_REF = 'androidWebView';

var WebViewState = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  ERROR: 'ERROR',
};

var defaultRenderLoading = () => (
  <View style={[styles.loadingView]}>
    <ActivityIndicator style={styles.loadingProgressBar} />
  </View>
);

var WebViewAndroid = createClass({
  propTypes: {
    url: PropTypes.string,
    source: PropTypes.object,
    baseUrl: PropTypes.string,
    html: PropTypes.string,
    htmlCharset: PropTypes.string,
    userAgent: PropTypes.string,
    injectedJavaScript: PropTypes.string,
    disablePlugins: PropTypes.bool,
    disableCookies: PropTypes.bool,
    javaScriptEnabled: PropTypes.bool,
    geolocationEnabled: PropTypes.bool,
    allowUrlRedirect: PropTypes.bool,
    builtInZoomControls: PropTypes.bool,
    onNavigationStateChange: PropTypes.func,
    onMessage: PropTypes.func,
    onShouldStartLoadWithRequest: PropTypes.func,
    renderError: PropTypes.func,
    renderLoading: PropTypes.func,
    startInLoadingState: PropTypes.bool,
  },
  getDefaultProps() {
    return {
      startInLoadingState: false,
    };
  },
  getInitialState () {
    const { startInLoadingState } = this.props;

    return {
      startInLoadingState,
      viewState: startInLoadingState ? WebViewState.LOADING : WebViewState.IDLE,
      lastErrorEvent: null,
    };
  },
  _onNavigationStateChange: function(event) {
    const { loading, errorCode } = event.nativeEvent;

    let viewState, lastErrorEvent;
    if (loading) {
      viewState = WebViewState.LOADING;
    } else if (errorCode !== 0) {
      viewState = WebViewState.ERROR;
      lastErrorEvent = event.nativeEvent;
    } else {
      viewState = WebViewState.IDLE;
    }

    this.setState({ viewState, lastErrorEvent });

    if (this.props.onNavigationStateChange) {
      this.props.onNavigationStateChange(event.nativeEvent);
    }
  },
  _onMessage: function(event) {
    if (this.props.onMessage) {
      this.props.onMessage({ nativeEvent: { data: JSON.parse(event.nativeEvent.message) }});
    }
  },
  _onShouldOverrideUrlLoading: function(event) {
    let shouldOverride = false;

    if (this.props.onShouldStartLoadWithRequest) {
      shouldOverride = !this.props.onShouldStartLoadWithRequest(event.nativeEvent);
    }

    RCTUIManager.dispatchViewManagerCommand(
      this._getWebViewHandle(),
      RCTUIManager.RNWebViewAndroid.Commands.shouldOverrideWithResult,
      [shouldOverride]
    );
  },
  goBack: function() {
    RCTUIManager.dispatchViewManagerCommand(
      this._getWebViewHandle(),
      RCTUIManager.RNWebViewAndroid.Commands.goBack,
      null
    );
  },
  goForward: function() {
    RCTUIManager.dispatchViewManagerCommand(
      this._getWebViewHandle(),
      RCTUIManager.RNWebViewAndroid.Commands.goForward,
      null
    );
  },
  reload: function() {
    this.setState({ viewState: WebViewState.LOADING });

    RCTUIManager.dispatchViewManagerCommand(
      this._getWebViewHandle(),
      RCTUIManager.RNWebViewAndroid.Commands.reload,
      null
    );
  },
  stopLoading: function() {
    RCTUIManager.dispatchViewManagerCommand(
      this._getWebViewHandle(),
      RCTUIManager.RNWebViewAndroid.Commands.stopLoading,
      null
    );
  },
  postMessage: function(data) {
    RCTUIManager.dispatchViewManagerCommand(
      this._getWebViewHandle(),
      RCTUIManager.RNWebViewAndroid.Commands.postMessage,
      [String(data)]
    );
  },
  injectJavaScript: function(data) {
    RCTUIManager.dispatchViewManagerCommand(
      this._getWebViewHandle(),
      RCTUIManager.RNWebViewAndroid.Commands.injectJavaScript,
      [data]
    );
  },
  render: function() {
    let otherView = null;
    const { renderLoading, renderError, style } = this.props;
    const { viewState, lastErrorEvent } = this.state;

    if (viewState === WebViewState.LOADING) {
      otherView = (renderLoading || defaultRenderLoading)();
    } else if (viewState === WebViewState.ERROR) {
      const domain = 'WebViewError';
      let { errorCode, errorDescription } = lastErrorEvent;
      otherView = renderError && renderError(domain, errorCode, errorDescription);
    } else if (viewState !== WebViewState.IDLE) {
      console.error('WebViewAndroid invalid state encountered: ' + viewState);
    }

    let webViewStyles = [styles.container, this.props.style];
    if (viewState === WebViewState.LOADING || viewState === WebViewState.ERROR) {
      // if we're in either LOADING or ERROR states, don't show the webView
      webViewStyles.push(styles.hidden);
    }

    const webView = (
      <RNWebViewAndroid
        ref={WEBVIEW_REF}
        {...this.props}
        style={webViewStyles}
        onNavigationStateChange={this._onNavigationStateChange}
        onMessageEvent={this._onMessage}
        onShouldOverrideUrlLoading={this._onShouldOverrideUrlLoading}/>
    );

    return (
      <View style={styles.container}>
        {webView}
        {otherView}
      </View>
    );
  },
  _getWebViewHandle: function() {
    return RN.findNodeHandle(this.refs[WEBVIEW_REF]);
  },
});

var RNWebViewAndroid = requireNativeComponent('RNWebViewAndroid', null);

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hidden: {
    height: 0,
    flex: 0, // disable 'flex:1' when hiding a View
  },
  loadingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingProgressBar: {
    height: 20,
  },
});

module.exports = WebViewAndroid;

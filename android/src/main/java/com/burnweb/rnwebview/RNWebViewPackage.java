package com.burnweb.rnwebview;

import com.facebook.react.ReactInstancePackage;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.*;

public class RNWebViewPackage extends ReactInstancePackage {

    private RNWebViewModule module;
    private RNWebViewManager viewManager;
    private ReactInstanceManager reactInstanceManager;

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext, ReactInstanceManager reactInstanceManager) {
        this.reactInstanceManager = reactInstanceManager;

        module = new RNWebViewModule(reactContext);
        module.setPackage(this);

        List<NativeModule> modules = new ArrayList<>();
        modules.add(module);

        return modules;
    }

    // Deprecated RN 0.47
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        viewManager = new RNWebViewManager();
        viewManager.setPackage(this);

        return Arrays.<ViewManager>asList(viewManager);
    }

    public RNWebViewModule getModule() {
        return module;
    }

    public RNWebViewManager getViewManager() {
        return viewManager;
    }

    public ReactInstanceManager getReactInstanceManager() {
        return reactInstanceManager;
    }
}

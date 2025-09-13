//
//  CapacitorWidgetPlugin.m
//  Technically Fit
//
//  Capacitor plugin for widget data sharing
//

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>
#import "WidgetDataManager.swift"

CAP_PLUGIN(CapacitorWidgetPlugin, "CapacitorWidget",
  CAP_PLUGIN_METHOD(updateStrainWidget, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(clearWidgetData, CAPPluginReturnPromise);
)
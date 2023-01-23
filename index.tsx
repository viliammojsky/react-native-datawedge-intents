/**
 * @providesModule DataWedgeIntents
 */
import { NativeModules, Platform } from 'react-native';

export let DataWedgeIntents: DataWedgeIntents;

type DataWedgeIntents = {
    ACTION_SOFTSCANTRIGGER: any;
    ACTION_SCANNERINPUTPLUGIN: any;
    ACTION_ENUMERATESCANNERS: any;
    ACTION_SETDEFAULTPROFILE: any;
    ACTION_RESETDEFAULTPROFILE: any;
    ACTION_SWITCHTOPROFILE: any;
    START_SCANNING: any;
    STOP_SCANNING: any;
    TOGGLE_SCANNING: any;
    ENABLE_PLUGIN: any;
    DISABLE_PLUGIN: any;
    sendIntent: ({ action, parameterValue }: SendIntent) => void;
    sendBroadcastWithExtras: ({action, extras}: ExtrasObject) => void;
    registerBroadcastReceiver: ({filterActions, filterCategories}: Filter) => void;
    registerReceiver: ({action, category}: RegisterReceiver) => void;
}

type SendIntent = {
    action: string;
    parameterValue: string
}

type ExtrasObject = {
    action: string;
    extras: {
        [x: string]: string | object;
        ["SEND_RESULT"]: string;
    }
}

type Filter = {
    filterActions: string[];
    filterCategories: string[]
}

type RegisterReceiver = {
    action: string;
    category: string
}

if (Platform.OS === 'android') {
    const RNDataWedgeIntents = NativeModules.DataWedgeIntents;

    DataWedgeIntents = {
        //  Specifying the DataWedge API constants in this module is deprecated.  It is not feasible to stay current with the DW API.
        // DEPRECATED
        ACTION_SOFTSCANTRIGGER: RNDataWedgeIntents.ACTION_SOFTSCANTRIGGER,
        ACTION_SCANNERINPUTPLUGIN: RNDataWedgeIntents.ACTION_SCANNERINPUTPLUGIN,
        ACTION_ENUMERATESCANNERS: RNDataWedgeIntents.ACTION_ENUMERATESCANNERS,
        ACTION_SETDEFAULTPROFILE: RNDataWedgeIntents.ACTION_SETDEFAULTPROFILE,
        ACTION_RESETDEFAULTPROFILE: RNDataWedgeIntents.ACTION_RESETDEFAULTPROFILE,
        ACTION_SWITCHTOPROFILE: RNDataWedgeIntents.ACTION_SWITCHTOPROFILE,
        START_SCANNING: RNDataWedgeIntents.START_SCANNING,
        STOP_SCANNING: RNDataWedgeIntents.STOP_SCANNING,
        TOGGLE_SCANNING: RNDataWedgeIntents.TOGGLE_SCANNING,
        ENABLE_PLUGIN: RNDataWedgeIntents.ENABLE_PLUGIN,
        DISABLE_PLUGIN: RNDataWedgeIntents.DISABLE_PLUGIN,
    
        //  THIS METHOD IS DEPRECATED, use SendBroadcastWithExtras
        sendIntent({action, parameterValue}: SendIntent) {
            RNDataWedgeIntents.sendIntent(action, parameterValue);
        },
        //  THIS METHOD IS DEPRECATED, use registerBroadcastReceiver
        registerReceiver({action, category}: RegisterReceiver) {
            RNDataWedgeIntents.registerReceiver(action, category);
        },

        // USE THESE
        sendBroadcastWithExtras(extrasObject: ExtrasObject) {
            RNDataWedgeIntents.sendBroadcastWithExtras(extrasObject);
        },
        registerBroadcastReceiver(filter: Filter) {
            RNDataWedgeIntents.registerBroadcastReceiver(filter);
        },
    };
    
}

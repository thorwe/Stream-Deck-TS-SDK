/*
 * Author: XeroxDev <help@xeroxdev.de>
 * Copyright (c) 2021.
 *
 */

import {IllegalArgumentError}    from '../errors/illegal-argument.error';
import {PossibleEventsToReceive} from '../interfaces/types';

/**
 * Singleton class for EventManager
 * @internal
 */
export class EventManager {
    private static _INSTANCE: EventManager;
    private registeredEvents: Map<string, Function[]> = new Map<string, Function[]>();

    private constructor() {
    }

    /**
     * Returns EventManager instance
     * @returns {EventManager}
     * @internal
     * @constructor
     */
    public static get INSTANCE(): EventManager {
        if (!this._INSTANCE)
            this._INSTANCE = new EventManager();
        return this._INSTANCE;
    }

    /**
     * Helper for decorators
     * @internal
     * @param {string} event
     * @param target
     * @param {string | symbol} propertyKey
     * @param {TypedPropertyDescriptor<any>} descriptor
     * @returns {TypedPropertyDescriptor<any>}
     * @constructor
     */
    public static DefaultDecoratorEventListener(event: string, target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
        const eventListener = <T>(actionName: string, instance: T) => {
            if (typeof actionName !== 'string') {
                throw new IllegalArgumentError(`actionName needs to be of type string but ${typeof actionName} given.`);
            }
            EventManager.INSTANCE.registerEvent(event, <T>(eventActionName: string | false, ...params: any[]) => {
                console.log('eventlister callbacks for', event)
                if (event in ['didReceiveGlobalSettings', 'globalSettingsAvailable', 'setupReady']) {
                    console.log('note that what is called actionName in callEvents before will here be eventActionName, not actionName (lambda in lambda).');
                }
                // doesn't trigger for global events ('globalSettingsAvailable', 'setupReady')
                if (!eventActionName || actionName === '*' || actionName === eventActionName) {
                    console.log('[UPSTREAM] triggering event:', event, 'eventActionName:', eventActionName, 'actionName:', actionName);
                    descriptor.value.apply(instance, params);
                    return;
                }

                console.warn('eventActionName:', eventActionName, 'actionName:', actionName, "failed condition: (!eventActionName || actionName === '*' || actionName === eventActionName)");
                
                // this would
                const fixVariant = 1;
                if (fixVariant === 1) {
                    if (!eventActionName || eventActionName === '*' || actionName === eventActionName) {
                        console.warn('[Fix variant one] triggering event:', event, 'eventActionName:', eventActionName, 'actionName:', actionName);
                        descriptor.value.apply(instance, params);
                    }
                } else {
                    // or this would
                    if (!eventActionName || actionName === '*' || eventActionName === '*' || actionName === eventActionName) {
                        console.warn('[Fix variant two] triggering event:', event, 'eventActionName:', eventActionName, 'actionName:', actionName);
                        descriptor.value.apply(instance, params);
                    }
                }
                // depending on if the actionName === '*' should be kept, although I guess that's what string | false was intended for
                // which would indicate variant one
            });
        };

        if (!target._sd_events) {
            target._sd_events = [];
        }

        target._sd_events.push(eventListener);

        return descriptor;
    }

    /**
     * Registers event
     * @internal
     * @param {string} eventName
     * @param {Function} callback
     */
    public registerEvent(eventName: string, callback: Function) {
        if (!this.registeredEvents.has(eventName))
            this.registeredEvents.set(eventName, []);
        this.registeredEvents.get(eventName)?.push(callback);
    }

    /**
     * Calls event
     * @internal
     * @param {PossibleEventsToReceive} eventName
     * @param {string} actionName
     * @param params
     */
    public callEvents(eventName: PossibleEventsToReceive, actionName: string = '*', ...params: any[]) {
        if (eventName in ['didReceiveGlobalSettings', 'globalSettingsAvailable', 'setupReady']) {
            console.log('event manager: callEvents', 'eventName:', eventName, 'actionName:', actionName, 'params:', params);
        }
        this.registeredEvents.get(eventName)?.forEach(val => val(actionName, ...params));
    }
}

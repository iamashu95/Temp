declare module '@angular/core' {
  export interface OnInit {
    ngOnInit(): void;
  }
  export interface OnDestroy {
    ngOnDestroy(): void;
  }
  export function Component(metadata: any): any;
  export function Inject(token: any): any;
  export function Input(bindingPropertyName?: string): any;
  export function ViewChild(selector: any, opts?: any): any;
  export class TemplateRef<T = any> {}
  export class ViewContainerRef {}
}

declare module 'carbon-components-angular' {
  export class BaseModal {
    [key: string]: any;
  }
  export class ModalService {
    [key: string]: any;
  }
  export class TableHeaderItem {
    constructor(...args: any[]);
    [key: string]: any;
  }
  export interface Label {
    text: string;
    [key: string]: any;
  }
}

declare module '@buc/common-components' {
  export type CCNotificationService = any;
  export const COMMON: any;
  export type DisplayRulesHelperService = any;
  export function getArray<T>(value: T): any;
  export function getCurrentLocale(): string;
  export function makeUnique<T>(value: T, key?: any): T;
  export class TableModelExtension {
    constructor(...args: any[]);
    [key: string]: any;
  }
}

declare module '@ngx-translate/core' {
  export class TranslateService {
    [key: string]: any;
  }
}

declare module 'lodash' {
  export function get(object: any, path: any, defaultValue?: any): any;
  export function includes(collection: any, value: any): boolean;
  export function cloneDeep<T>(value: T): T;
  export function isEmpty(value: any): boolean;
  export function isEqual(value: any, other: any): boolean;
  export function upperFirst(value: string): string;
}

declare module 'rxjs' {
  export class Subject<T = any> {
    pipe(...args: any[]): any;
    next(value: T): void;
    subscribe(...args: any[]): any;
  }
  export class Subscription {
    unsubscribe(): void;
  }
}

declare module 'rxjs/operators' {
  export function debounceTime<T>(value: T): any;
  export function distinctUntilChanged(): any;
}

declare module '@buc/svc-angular' {
  export class BucBaseUtil {
    static isVoid(value: any): boolean;
  }
  export class BucSvcAngularStaticAppInfoFacadeUtil {
    static [key: string]: any;
  }
}

declare module '@call-center/order-shared/lib/order-shared.service' {
  export class OrderSharedService {
    [key: string]: any;
  }
}

declare module '@call-center/order-shared/lib/shared-extension.constants' {
  export const SharedExtensionConstants: any;
}

declare module '@call-center/order-shared/lib/common/order.constants' {
  export const Constants: any;
}

declare module '@call-center/order-shared/lib/data-service/order-common.service' {
  export class OrderCommonService {
    [key: string]: any;
  }
}

declare module '../data-service/adjust-pricing-data.service' {
  export class ExtnAdjustPricingDataService {
    [key: string]: any;
  }
}

declare module '../../features/extension.constants' {
  export const ExtensionConstants: any;
}

declare module '../../features/manage-charge-pop-up/manage-charge-pop-up.component' {
  export class ManageChargePopUpComponent {
    [key: string]: any;
  }
}

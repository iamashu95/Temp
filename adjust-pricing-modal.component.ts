/*
 * IBM Confidential
 * OCO Source Materials
 * 5737-D18, 5725-D10
 *
 * (C) Copyright International Business Machines Corp. 2021, 2024
 *
 * The source code for this program is not published or otherwise divested
 * of its trade secrets, irrespective of what has been deposited with the
 * U.S. Copyright Office.
 */

import { Component, Inject, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { CCNotificationService, COMMON, DisplayRulesHelperService, getArray, getCurrentLocale, makeUnique, TableModelExtension } from '@buc/common-components';
import { TranslateService } from '@ngx-translate/core';
import { BaseModal, Label, ModalService, TableHeaderItem } from 'carbon-components-angular';
import { get, includes, cloneDeep, isEmpty, isEqual, upperFirst } from 'lodash';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BucBaseUtil,BucSvcAngularStaticAppInfoFacadeUtil } from '@buc/svc-angular';
import { OrderSharedService } from '@call-center/order-shared/lib/order-shared.service';
import { SharedExtensionConstants } from '@call-center/order-shared/lib/shared-extension.constants';
import { Constants } from '@call-center/order-shared/lib/common/order.constants';
import { OrderCommonService } from '@call-center/order-shared/lib/data-service/order-common.service';
import { ExtnAdjustPricingDataService } from '../data-service/adjust-pricing-data.service';
import { ExtensionConstants } from '../../features/extension.constants';
import { ManageChargePopUpComponent } from '../../features/manage-charge-pop-up/manage-charge-pop-up.component';
@Component({
    selector: 'call-center-adjust-pricing-modal',
    templateUrl: './adjust-pricing-modal.component.html',
    styleUrls: ['./adjust-pricing-modal.component.scss'],
    providers:[ OrderSharedService ]
})
export class ExtnAdjustPricingModalComponent extends BaseModal implements OnInit, OnDestroy {
    EXTENSION = {
        TOP: SharedExtensionConstants.ADJUST_PRICING_MODAL_RS_TOP,
        BOTTOM: SharedExtensionConstants.ADJUST_PRICING_MODAL_RS_BOTTOM
    };
 @ViewChild('chargeName', { static: true }) private chargeName: TemplateRef<any>;
    @ViewChild('chargeType', { static: true }) private chargeType: TemplateRef<any>;
    @ViewChild('amount', { static: true }) private amount: TemplateRef<any>;
    @ViewChild('chargeApplyTo', { static: true }) private chargeApplyTo: TemplateRef<any>;
    @ViewChild('amountReadOnly', { static: true }) private amountReadOnly: TemplateRef<any>;
    @ViewChild('chargeNameReadOnly', { static: true }) private chargeNameReadOnly: TemplateRef<any>;
    @ViewChild('chargeTypeReadOnly', { static: true }) private chargeTypeReadOnly: TemplateRef<any>;
    @ViewChild('chargeApplyToReadOnly', { static: true }) private chargeApplyToReadOnly: TemplateRef<any>;
    @ViewChild('removeActionTemplateRef', { static: true }) private removeActionTemplateRef: TemplateRef<any>;
    @ViewChild('chargePercentage', { static: true }) private chargePercentage: TemplateRef<any>;
    @ViewChild('chargePercentageReadOnly', { static: true }) private chargePercentageReadOnly: TemplateRef<any>;
    @ViewChild('chargeCategory', { static: true }) private chargeCategory: TemplateRef<any>;

    public readonly defaultPageLen = Constants.TABLE_PAGE_LENGTH_10;
    componentId = 'AdjustPricingModalComponent';
    model = new TableModelExtension();
    lineModel = new TableModelExtension();
    paginationTranslations: any;
    pageSize: number;
    pageNo: number;
    chargeHeaders: any;
    summaryDetails: any;
    headerChargeDetailsData: any;
    chargeNameList = [];
    chargeInfoList = [];
    chargeApplyToList = [];
    couponList = [];
    mapChargeCategory;
    mapCouponList;
    emptyChargeName: any;
    applyEnabled = true;
    appliedCouponPromo = [];
    newChargeDetails = {
        HeaderCharge: [],
        LineCharge: []
    };
    headerCharges: any;
    lineCharges: any;
    orderHeaderKey: string;
    orderLineKey: string;
    isLineLevel: boolean;
    isDraftOrder:any;
    lineChargeDetailsData: any;
    currentApplyTo: any;
    isApplyToChanged: boolean;
    selectedOrderLines = [];
    saveChargesEnabled = false;
	isSaveAllChargesEnabled = false;
    isChargesAdded = false;
    isAnyChangeAppliedOnModal = false;
    note = '';
    allowedModifications;
    allowModificationPrice: boolean;
    modificationInfoList= [];
    permissionsArray = [];
    chargeTypes: any;
    flowOutput: any;
    readonly resourceIdsForOrderActions = {
      ADD_MODIFY_CHARGES_ORDER : 'ICC000003',
      ADD_MODIFY_CHARGES_ORDERLINE : 'ICC000004'
    }
    isResourceAllowedToAddChangeOrderCharges: boolean;
    notificationShown = false;
    notificationObj: any;
    selectedChargePairs = [];
    remainChargeNamesForType = {};
    totalChargeNamesForType = {};
    // flag for toggle the add new row button
    ranOutOfChargeOptions = false;
    isInitialized = false;
    showManagerIDField = false;
    managerID = '';
    invalidManagerID = false;
    hasOverrideError = false;
    cTypes;
    modifiedIndex;
    modifiedId;
    modifiedAmount;
    violationOutput;
    curLocale;
    currencySymbolBefore;


    


    protected readonly nlsMap: any = {
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CATEGORY': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_NAME': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_TYPE': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_AMOUNT': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_TAXES': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_APPLY_TO': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_LINE': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_UNIT': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_ADJUSTMENT_SAVED_MSG': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGES_ERROR_MSG': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.MSG_TOOLTIP_ORDER_LINE': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.MSG_TOOLTIP_ORDER': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGENAMENONREFUNDABLEDES': '',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_BILLABLE':'',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_DISCOUNT':'',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.MSG_TOOLTIP_LINE_DISCOUNT':'',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.MSG_TOOLTIP_LINE_CHARGE':'',

        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.EXTN_LABEL_CHARGE_PER':'',
        'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.EXTN_LABEL_CHARGE_NAME':'',
		'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.EXTN_LABEL_CHARGE_TYPE':'',	
		'ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.EXTN_LABEL_CHARGE_CATEGORY':'',	
			
    };

    private amountChangedSub: Subject<any> = new Subject();
    private amountSubscription = new Subscription();
	isPromoUpdated = false;
   
    strChargePercentage: string;
    selectedChargeType:string='discount';
    cmbApplyTo: string;
    cmbChargeName: string='';
    lblChargeName: string;
    errorMsg: string;
    txtChargeAmount: string;
    chargeAmountVisibleReadOnly: boolean;

    isManageChargeEnabled: any;
    enabledEnterpriseModelList:any;
    percentOffVisible: boolean = false;
    percentOffVisibleReadOnly: boolean=false;
    cmbApplyToReadOnly: boolean=false;
    enablePercentOff: boolean=false;
    lineOrOrderStatus: any;
    revisedManageChargesList=[];
    extnChargeCategories: any;
    extnDiscountCategories: any;
    getChargeCategoryList: any;
    bpercentOffReadOnly: boolean;
    chargePerUnit:string;
    chargePerLine:string;
    showRadiobuttonset: boolean;
    optionsBinding_output: any;
    selectedChargeName;
    invalidMessage: string;
    enterpriseCode: any;
    sellerOrgCode: any;
    entryType: any;
    returnShippingFeeList:any;
    preShipChargeNamesListMashupOut=[];
    postShipChargeNamesListMashupOut=[];
    input: { CommonCode: { OrganizationCode: any; }; };
    checkChargeDetails=[];
   
    hideChargeName: string;
    hideAmount: string;
    orderShippedStatus = 3700;
    appliedDiscount: string;
    maxLst: number=0;
    disablePercentOff: boolean;
    disableChargeAmount: boolean;
    discountCategory=[];
    chargeCategorys=[];
    allChargeNameList=[];
    modelForChargeNames:any;
    tempModel: any;
    selectedOptionForChargeNameList: any[];
    selectedChargeCategory= 'DISCOUNT';
    currentChargeCategorys: string;
    shippingDiscountCategory=[];

    //OMS-77719 start    
    getCommonCodeListGrpManageCharge:any;
    isManageChargesDisabledListOutput:any;
    notification = false;
    exceptionListOutput:any;
    userHierarchyOutput:any;
    totalPreviousDiscount:any;
    getTwoStepApprovalModel:any;
    shippingChargeNameList: any[];
    onChangeApply = false;
    allChargeList: any;
    chargeCagetoryList: any;
    extnChargePercentage: string;
    exitChargeNameKey: any;
   //OMS-77719 end


    constructor(
        @Inject('modalData') public modalData,
        public translate: TranslateService,
        private orderCommonService: OrderCommonService,
        private notificationService: CCNotificationService,
        public orderSharedService:OrderSharedService,
        public adjustPricingDataService:ExtnAdjustPricingDataService,
        private displayRulesHelperService: DisplayRulesHelperService,
        //OMS-77719 start    
        public modalService: ModalService,
        //OMS-77719 end

    ) {
        super();
    }

    async ngOnInit() {
        await this.initialize();
        this.amountSubscription = this.amountChangedSub.pipe(
            debounceTime(750),
            distinctUntilChanged())
            .subscribe(({ index, value, chargeAmountId }) => {
            isEmpty(value) ? null : this.saveCharges(index, value, chargeAmountId)
            this.modifiedId = chargeAmountId;
            this.modifiedAmount = value;
            this.modifiedIndex = index;
        });
        this.isInitialized = true;
    }


    async initialize() {
        this.pageSize = Constants.TABLE_PAGE_LENGTH_10;
        this.pageNo = this.pageNo ? this.pageNo : 1;
        this.curLocale = getCurrentLocale();
        if (this.curLocale.startsWith('zh')) {
            this.curLocale = 'zh';
        }
		this.isSaveAllChargesEnabled = this.displayRulesHelperService.getRuleValueForOrg(this.modalData.summaryDetails.EnterpriseCode, Constants.ICC_SINGLE_ADJUST_PRICING_SAVE) === Constants.CHECK_YES;
        this.orderHeaderKey = this.modalData.summaryDetails.OrderHeaderKey;
        this.isLineLevel = this.modalData.isLineLevel
        this.isDraftOrder = this.modalData.summaryDetails.DraftOrderFlag === 'Y';
         

        
        await this.extnInitializeMashup();
        this.customInitialize();

        if (!this.isLineLevel&& isEqual(this.lineOrOrderStatus , ExtensionConstants.EXTN_PRESHIP)) {
                 this.currentChargeCategorys = ExtensionConstants.EXTN_SHIPPING; 
        }else if(!this.isLineLevel && isEqual(this.lineOrOrderStatus , ExtensionConstants.EXTN_POSTSHIP)){
            this.currentChargeCategorys =ExtensionConstants.EXTN_SHIPPING_DISCOUNT_UPPER;
        }else{
            this.currentChargeCategorys = ExtensionConstants.EXTN_DISCOUNT_UPPER;
        }

        if (!this.exitChargeNameKey) {
            this.exitChargeNameKey = []; // Ensure it's initialized as an array
        }
        
        this.modalData?.lineDetails?.line?.LineCharges?.LineCharge?.forEach((element) => {
            if (element.ChargeNameKey) {
                this.exitChargeNameKey.push({ ChargeNameKey: element.ChargeNameKey });
            }
        });

        await this._initTranslations();
        this.hasResourcePremissions();
        this.isLineLevel ? this.getOrderLineDetails(this.isSaveAllChargesEnabled ? cloneDeep(this.modalData) : this.modalData, this.isChargesAdded) :
        this.getOrderDetails(this.isSaveAllChargesEnabled ? cloneDeep(this.modalData.summaryDetails) : this.modalData.summaryDetails);
        this.prepareHeaders();
        await this.callInitApis();
        this.prepareChargeTypes();
        await this.initializeChargeTables();
        this.isChargeModificationPermissionAllowed();

        //newly added (need to check)

        let isLineMode = this.modalData.isLineLevel
        if(isLineMode === true){
            if(!this.modalData.summaryDetails.OrderHeaderKey){
                const err = "Manage Charge is not allowed in current status. Please respond to alert generated once order is shipped.";
                this.showNotification(err);
            }
            
        }
    }
   
    

    prepareChargeTypes(){
        this.cTypes = [
            {
                content: this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_BILLABLE'],
                code:Constants.BILLABLE_CODE
            },
            {
                content: this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_DISCOUNT'],
                code:Constants.DISCOUNT_CODE
            }
        ];

        // keep track of the total number of chargeNames for each type, used to recover the number for tracking purposes
        // using the code of each charge type for identification
        // this.totalChargeNamesForType[Constants.DISCOUNT_CODE] = this.getChargeNameList('Y', 'Y').length;
        // this.totalChargeNamesForType[Constants.BILLABLE_CODE] = this.getChargeNameList('N', 'Y').length;

        this.remainChargeNamesForType[Constants.DISCOUNT_CODE] = this.totalChargeNamesForType[Constants.DISCOUNT_CODE];
        this.remainChargeNamesForType[Constants.BILLABLE_CODE] = this.totalChargeNamesForType[Constants.BILLABLE_CODE];
    }

    _repopulateCharges(data, promotions, removeOperation){
        this.selectedChargePairs = [];
        // recover the remaing charge names numbers back to the original
        this.cTypes.forEach(ctype => {
            this.remainChargeNamesForType[ctype.code] = this.totalChargeNamesForType[ctype.code];
        })
        data.forEach(charges => {
            // make sure the row actually exists
            const obj = {
                chargeType: charges[0].data.code,
                chargeName: charges[2].data.value
            };
            this.selectedChargePairs.push(obj);
            if(charges[3]?.value || charges[3]?.data?.value && this.isLineLevel){
                this.remainChargeNamesForType[obj.chargeType] -= 1;
            }else{
                this.remainChargeNamesForType[obj.chargeType] -= 1;
            }
        });
        if(promotions == 0 && removeOperation){
            // promotions are decrement to 0 and at the same time
            this.remainChargeNamesForType[Constants.DISCOUNT_CODE] += 1
        }
    }

    async getOrderDetails(modalData) {
        this.summaryDetails = (modalData.isPromotionApplied) ? (modalData.responseData) : modalData;
        if (!isEmpty(this.summaryDetails?.Promotions)) {
            this.appliedCouponPromo = (this.summaryDetails.Promotions.Promotion);
        }
        const charges = this.groupByUtil(this.summaryDetails?.HeaderCharges?.HeaderCharge, Constants.KEY_ISMANUAL);
        this.headerChargeDetailsData = {
            HeaderCharge: charges
        };
        this.allowedModifications = this.summaryDetails?.Modifications;
        if(this.modificationInfoList.length == 0){
          this.modificationInfoList = this.allowedModifications?.Modification;
        }
        if (modalData.isPromotionApplied) {
            await this.tableData();
        }
        this.addChargeDescriptions(charges);
		this.currencySymbolBefore = COMMON.isCurrencySymbolBefore(this.curLocale, this.summaryDetails?.PriceInfo?.Currency);
    }

    getOrderLineDetails(modalData, isChargesAdded) {
        let orderLineData;
        if (isChargesAdded) {
             this.selectedOrderLines = modalData?.OrderLine.filter((orderLine) => orderLine.OrderLineKey === this.orderLineKey);
            orderLineData = this.selectedOrderLines[0];
        } else {
            this.summaryDetails = modalData?.summaryDetails;
            orderLineData = modalData?.lineDetails.line;
            if(!this.modalData.skipModificationPermissionCheck){
            if(!orderLineData.Modifications && this.summaryDetails.OrderLines[0]){
              orderLineData.Modifications= this.summaryDetails.OrderLines[0].Modifications;
            }
            }
            this.selectedOrderLines = [orderLineData];
        }
        this.currencySymbolBefore = COMMON.isCurrencySymbolBefore(this.curLocale, this.summaryDetails?.PriceInfo?.Currency);
        this.selectedOrderLines = this.selectedOrderLines.map(obj => ({ ...obj, PriceInfo: { Currency: this.summaryDetails?.PriceInfo?.Currency } }));
        if(this.modificationInfoList.length == 0 && !this.modalData.skipModificationPermissionCheck){
        this.modificationInfoList = orderLineData.Modifications?.Modification;
        }
        this.lineChargeDetailsData = orderLineData.LineCharges;
        this.orderLineKey = this.modalData.lineDetails.line.OrderLineKey;
        if (!this.lineChargeDetailsData?.LineCharge !== undefined) {
            const charges = this.lineChargeDetailsData?.LineCharge
                ?.map((element) => ({
                    ...element,
                    ChargeApplyTo: this.getChargesApplyTo(element)
                }));
            this.lineChargeDetailsData.LineCharge = this.groupByUtil(charges, Constants.KEY_ISMANUAL);
            this.addChargeDescriptions(this.lineChargeDetailsData.LineCharge);
        }
    }

    addChargeDescriptions(charges) {
        charges?.forEach( charge => {
            if (charge.ChargeAmount > 0){
                if (charge.IsShippingCharge === 'N' ){
                    if (this.summaryDetails.Awards?.Award ){
                    const promo = this.summaryDetails.Awards.Award.filter(award =>
                        ( charge.ChargeCategory === award.ChargeCategory && charge.ChargeName === award.ChargeName
                        && award.AwardApplied === 'Y' ));

                        promo.forEach( item => {
                            charge.Description = charge.Description ? charge.Description + ", " + item.Description : item.Description;
                        });
                    }
                }
            }
        });
    }

    protected async _initTranslations() {
        const keys = Object.keys(this.nlsMap);
        const json = await this.translate.get(keys).toPromise();
        keys.forEach(k => this.nlsMap[k] = json[k]);
    }

    async callInitApis() {
        const couponInput = {
            OrderHeaderKey: this.orderHeaderKey,
            GetCoupons: 'Y',
            GetOrderRules: 'Y'
        };
        const categoryListInput = {
            CallingOrganizationCode: this.summaryDetails.EnterpriseCode,
            DisplayLocalizedFieldInLocale: BucSvcAngularStaticAppInfoFacadeUtil.getOmsUserLocale(),
            DocumentType: this.summaryDetails.DocumentType
        };

        const chargeKeys = {
            CallingOrganizationCode: this.summaryDetails.EnterpriseCode,
            DisplayLocalizedFieldInLocale: BucSvcAngularStaticAppInfoFacadeUtil.getOmsUserLocale(),
            DocumentType: this.summaryDetails.DocumentType,
            ChargeCategory: ''
        };
        
        await this.orderCommonService.getChargeNameAndCategoryList(categoryListInput, chargeKeys).then(
            mashupOutput => {
                this.mapChargeCategory = mashupOutput.getChargeCategoryList;
                this.emptyChargeName = mashupOutput.getChargeNameList;
            // if(this.mapChargeCategory.ChargeCategoryList.ChargeCategory && this.emptyChargeName.ChargeNameList.ChargeName){
            //     this.chargeInfoList = this.emptyChargeName.ChargeNameList.ChargeName.map(chargeName => {
            //         const chargeCategory = this.mapChargeCategory.ChargeCategoryList.ChargeCategory.find(catgory =>
            //         catgory.ChargeCategory === chargeName.ChargeCategory);
            //         const cName= chargeName.ChargeName;
            //         const chargeNameDesc = chargeCategory.IsRefundable ==='Y' ? chargeName.Description : this.translate.instant('ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGENAMENONREFUNDABLEDES', {cName: chargeName.Description});
            //         return {category: chargeCategory.ChargeCategory, isRefundable:chargeCategory.IsRefundable, isBillable: chargeCategory.IsBillable,
            //             desc:chargeNameDesc,isDiscount:chargeCategory.IsDiscount, cName:cName}
            //       });
            //     }
        });
        if (isEqual(this.isManageChargeEnabled, "Y" )) {
            const chargeCategory: any[] = [];
            const chargeCategoryList = this.mapChargeCategory?.ChargeCategoryList?.ChargeCategory || [];
            const lineMode = this.isLineLevel;

            if ((!BucBaseUtil.isVoid(this.revisedManageChargesList)) && (!BucBaseUtil.isVoid(chargeCategoryList))) {
            for (const codeValue of this.revisedManageChargesList) {
                for (const category of chargeCategoryList) {
                
                if (this.isLineLevel) {
                    if (codeValue.CodeShortDescription === 'Unit' && codeValue.CodeValue === category.ChargeCategory) {
                    chargeCategory.push(category);
                    }
                } else {
                if (codeValue.CodeShortDescription === 'Order' && codeValue.CodeValue === category.ChargeCategory) {
                    chargeCategory.push(category);
                }
              }
                }
            }
            }

            const chargeCategoryTypes = chargeCategory;
            const discountCategoryFilter: any[] = [];
            const finalChargeCategory: any[] = [];
            if (chargeCategoryTypes?.length) {
                chargeCategoryTypes.forEach((type: any) => {
                  if (isEqual(type.IsDiscount, 'N')) {
                    finalChargeCategory.push(type);
              
                    if (isEqual(type.ChargeCategory, ExtensionConstants.EXTN_SHIPPING)) {
                      this.chargeCategorys.push({
                        content: type.Description,
                        IsDiscount: type.IsDiscount,
                        value: type.ChargeCategory,
                        selected: true
                      });
                    }
                  } else if (isEqual(type.IsDiscount, 'Y')) {
                    discountCategoryFilter.push(type);
              
                    if (isEqual(type.ChargeCategory, ExtensionConstants.EXTN_SHIPPING_DISCOUNT_UPPER)) {
                      this.shippingDiscountCategory.push({
                        content: type.Description,
                        IsDiscount: type.IsDiscount,
                        value: type.ChargeCategory,
                        selected: true
                      });
                    }
                    else if (isEqual(type.ChargeCategory, ExtensionConstants.EXTN_DISCOUNT_UPPER)) {
                      this.discountCategory.push({
                        content: type.Description,
                        IsDiscount: type.IsDiscount,
                        value: type.ChargeCategory,
                        selected: true
                      });
                    }
                  }
                });
              }
              
          this.extnSetValidChargeNames();
        }
    }

    prepareHeaders() {
        this.chargeHeaders = [
			new TableHeaderItem({ data: this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.EXTN_LABEL_CHARGE_TYPE'],
				sortable: false, style: { width: '12rem', height: '3rem' } }),

		   new TableHeaderItem({ data: this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.EXTN_LABEL_CHARGE_CATEGORY'],
				  sortable: false, style: { width: '16rem', height: '3rem' } }),

			new TableHeaderItem({ data: this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.EXTN_LABEL_CHARGE_NAME'],
				sortable: false, style:this.isLineLevel? { width: '35rem', height: '3rem' }:{ width: '25rem', height: '3rem' }, className: this.isLineLevel ? 'headerChargeName' : '' }),

			this.isLineLevel &&
			new TableHeaderItem({ data: this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_APPLY_TO'],
				sortable: false, style: { width: '12rem', height: '3rem' }, className: 'headerApplyTo' }),
			this.isLineLevel &&
				new TableHeaderItem({ data: this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.EXTN_LABEL_CHARGE_PER'],
					sortable: false, style: { width: '17rem', height: '3rem' } }),

			new TableHeaderItem({ data: this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_AMOUNT'],
				sortable: false, style: { width: '15rem', height: '3rem' } }),
			this.isSaveAllChargesEnabled &&
            new TableHeaderItem({ data: '', sortable: false, style: { width: '3rem', height: '3rem' } })
        ]
    }

    async initializeChargeTables() {
        this.model.header = this.chargeHeaders;
        this.model.isLoading = false;
        this.model.pageLength = this.pageSize;
        this.model.currentPage = this.pageNo;
        this.model.data = [];
        await this.tableData();
    }
    isChargeModificationPermissionAllowed(){
      this.allowModificationPrice = false;
      if(this.modificationInfoList?.length > 0){
         if(this.modificationInfoList.find(mod => mod.ModificationType === Constants.STR_PRICE
          && mod.ModificationAllowed === 'Y')){
          this.allowModificationPrice = true;
         }
      }else if(this.modalData.skipModificationPermissionCheck){
        this.allowModificationPrice = true;
      }
      return this.allowModificationPrice;
    }
    async addNewChargeRow() {
        this.selectedChargeType=ExtensionConstants.EXTN_DISCOUNT;
      if(this.isResourceAllowedToAddChangeOrderCharges){
        if(this.isChargeModificationPermissionAllowed){
            if (this.isLineLevel) {
                const summaryLineCharge = {
                    ChargeAmount: '',
                    ChargeCategory: '',
                    ChargeName: '',
                    ChargeType: '',
                    ChargeApplyTo: '',
                    ChargePercentage:'',
                    newRow: true,
                };

                if (this.lineChargeDetailsData?.LineCharge === undefined) {
                    const lineChargeArr = [];
                    lineChargeArr.push(summaryLineCharge);
                    const key = Constants.KEY_LINE_CHARGE;
                    this.lineChargeDetailsData[key] = lineChargeArr;
                } else {
                    this.lineChargeDetailsData.LineCharge.push(summaryLineCharge);
                }
                this.strChargePercentage='';
            } else {
                const summaryCharge = {
                    ChargeAmount: '',
                    ChargeCategory: '',
                    ChargeType: '',
                    ChargeName: '',
                    newRow: true,
                };
                if (this.headerChargeDetailsData?.HeaderCharge === undefined) {
                    const headerChargeArr = [];
                    headerChargeArr.push(summaryCharge);
                    const key = Constants.KEY_HEADER_CHARGE;
                    this.headerChargeDetailsData[key] = headerChargeArr;
                } else {
                    this.headerChargeDetailsData.HeaderCharge.push(summaryCharge);
                }
            }
        }
        this.tableData();
        if(this.isSaveAllChargesEnabled){
            this.saveChargesEnabled = false;
        }
      }
      this.changeInChargeAddNewLine()
    }

    async tableData() {
        const chargeSummaryTable = (model: TableModelExtension, data: Array<any>) => {

            model.asMap = {};
            model.fullTable = this.prepareChargeSummaryTableResponse(data);
            model.fullTableLen = model.fullTable.length;
            model.totalDataLength = model.fullTableLen;

            if (model.fullTableLen > 0) {
                model.pages = COMMON.calcPagination(model.fullTable, model.pageLength);
                model.calcPgLen = model.pageLength;
                model.data = model.pages[0];
                model.currentPage = 1;
                if(!this.isInitialized){
                    this._repopulateCharges(this.model.data, 0, false);
                }
            } else {
                model.data = [];
            }
        };

        try {
            let data;
            if (this.isLineLevel) {
                if (this.lineChargeDetailsData) {
                    data = getArray(this.lineChargeDetailsData?.LineCharge);
                    const filteredData = data.filter((item) => !(item.IsManual === 'N' && !parseFloat(item.ChargeAmount)));
                    if(filteredData.length > 0){
                    [{ model: this.model }]
                        .forEach(o => chargeSummaryTable(o.model, filteredData));
                    }else{
                      this.addNewChargeRow();
                    }
                } else {
                    [this.model]
                        .forEach(m => {
                            m.totalDataLength = 0;
                            m.data = [];
                        });
                }
            } else {
                if (this.headerChargeDetailsData) {
                    data = getArray(this.headerChargeDetailsData?.HeaderCharge);
                    const filteredData = data.filter((item) => !(item.IsManual === 'N' && !parseFloat(item.ChargeAmount)));
                    if(filteredData.length > 0){
                        [{ model: this.model }]
                            .forEach(o => chargeSummaryTable(o.model, filteredData));
                    }else{
                      this.addNewChargeRow();
                    }
                } else {
                    [this.model]
                        .forEach(m => {
                            m.totalDataLength = 0;
                            m.data = [];
                        });
                }
            }
        } catch (err) {
            [this.model]
                .forEach(m => {
                    m.totalDataLength = 0;
                    m.data = [];
                });
            console.log('error occured', err);
        }
    }

    mapChargeTypeToDisplay(isBillable, isDiscount){
        return isBillable === 'Y' && isDiscount === 'N'? this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_BILLABLE'] : this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_DISCOUNT'];
    }

    prepareChargeSummaryTableResponse(response) {
        this.allChargeList=response;

        return response.map((i, index) => {
            this.extnEvaluation(i); 
            const currentCharge = this.getChargeDetails(i);
            const chargeDisplayName = this.getChargeName(i.ChargeCategory, i.ChargeName, i);
            const selectedChargePair = this.selectedChargePairs[index];
            const chargeTypeKey = selectedChargePair?.chargeType || i?.ChargeType ||
                (i.IsBillable == 'Y' && i.IsDiscount == 'N' ? Constants.BILLABLE_CODE : Constants.DISCOUNT_CODE);
            const cachedChargeName = selectedChargePair?.chargeName;
            if (selectedChargePair) {
                selectedChargePair.chargeName = null;
            }
            const filteredChargeNames = this._filterSelectedChargeNames(
                this.allChargeNameList,
                chargeTypeKey
            );
            if (selectedChargePair) {
                selectedChargePair.chargeName = cachedChargeName;
            }
            const chargeNameList = this._markSelectedChargeOption(
                filteredChargeNames,
                i?.ChargeName,
                chargeDisplayName
            );
            const row = [
                {
                    data: {
                        value: this.mapChargeTypeToDisplay(i.IsBillable, i.IsDiscount),
                        index,
                        code: i.IsBillable == 'Y' && i.IsDiscount == 'N' ?  Constants.BILLABLE_CODE : Constants.DISCOUNT_CODE,
                        newRow: i.newRow,
                        list: this.isSaveAllChargesEnabled ? this.getChargeTypeList(i.ChargeType) : this.getChargeTypeList(),
                        isDisable: false,
                        isManual: i.IsManual
                    },
                    template: !this.isResourceAllowedToAddChangeOrderCharges || this.cannotAllowModification(i.IsManual,i.newRow) ? this.chargeTypeReadOnly : this.chargeType,
                    title: this.mapChargeTypeToDisplay(i.IsBillable, i.IsDiscount)
                },
                {
                    data: {
                       // value: i?.ChargeCategoryDetails?.Description,
                        value:this.extnSetChargeCategoryName(i),
                        index,
                        categoryTypeList: this.extnSetChargeCategoryList(),
                        newRow: i.newRow,
                        isDisable: false,
                        isManual: i.IsManual
                    },
                    template: !this.isResourceAllowedToAddChangeOrderCharges || this.cannotAllowModification(i.IsManual,i.newRow) ? this.chargeTypeReadOnly : this.chargeCategory,
                    title: i.chargeCategory
                },
                {
                    data: {
                        value: chargeDisplayName,
                        // discountLabel:  i.Description ? (i.IsDiscount === 'Y' ? this.translate.instant('ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.MSG_TOOLTIP_LINE_DISCOUNT', {desc: i.Description}) : 
                        // this.translate.instant('ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.MSG_TOOLTIP_LINE_CHARGE', {desc: i.Description })) : "",
                        chargeNameList,
                        index,
						list: this.isSaveAllChargesEnabled && i.ChargeType ? this.getChargeNameList(i.IsDiscount, i.IsBillable, i.ChargeName) : [],
                        newRow: i.newRow,
                        isDisable: false,
                        isManual: i.IsManual
                    },
                    template:!this.isResourceAllowedToAddChangeOrderCharges || this.cannotAllowModification(i.IsManual,i.newRow)   ? this.chargeNameReadOnly : this.chargeName,
                    title: chargeDisplayName,
                },
                this.isLineLevel && {
                    data: {
                        value: this.extnGetApplyName(i),
                        index,
                        //list: this.getApplyToList(i.ChargeApplyTo),
                        newRow: i.newRow,
                        isDisable: i.ChargeName ? false : true,
                        isManual: i.IsManual,
                        uniqueId: (i.ChargeCategory) ? index + '~' + (i.ChargeCategory) : index,
                    },
                    template:!this.isResourceAllowedToAddChangeOrderCharges ||  this.cannotAllowModification(i.IsManual,i.newRow)    ? this.chargeApplyToReadOnly : this.chargeApplyTo,
                    title: i.ChargeApplyTo
                },
                this.isLineLevel &&{
                    data: {
                        value: i?.Extn?.ExtnChargePercentage,
                        index,
                        isDisable: this.disablePercentOff,
                        isManual: i.IsManual,
                        uniqueId: (i.ChargeCategory) ? index + '~' + (i.ChargeCategory) : index,
                        chargePercentOffId: (i.ChargeCategory) ? index + '~' + (i.ChargeCategory) : index,
                    },
                    template:!this.isResourceAllowedToAddChangeOrderCharges || this.cannotAllowModification(i.IsManual,i.newRow)   ? this.chargePercentageReadOnly : this.chargePercentage,
                    title: i?.Extn?.ExtnChargePercentage,
                },
                {
                    data: {
                        value: currentCharge, // formatNumber(this.curLocale, currentCharge),
                        index,
                        isDiscount: i.ChargeCategory,
                        isDisable: this.disableChargeAmount,
                        isManual: i.IsManual,
                        uniqueId: (i.ChargeCategory) ? index + '~' + (i.ChargeCategory) : index,
                        chargeAmountId: (i.ChargeCategory) ? index + '~' + (i.ChargeCategory) : index,
                    },
                    template:!this.isResourceAllowedToAddChangeOrderCharges ||  this.cannotAllowModification(i.IsManual,i.newRow)     ? this.amountReadOnly : this.amount,
                    title: i.ChargeAmount
                },
				this.isSaveAllChargesEnabled && {
                    data: {
                        value: '',
                        index,
                        newRow: i.newRow
                    },
                    template: this.removeActionTemplateRef,
                    title: 'Remove'
                },
            ];
            return row;
        });
    }
  
   cannotAllowModification(manual, newRow){
    return !this.allowModificationPrice || !this.isManual(manual, newRow) ;
   }
   hasResourcePremissions(){
      const permissionToCheck= !this.isLineLevel ? this.resourceIdsForOrderActions.ADD_MODIFY_CHARGES_ORDER : this.resourceIdsForOrderActions.ADD_MODIFY_CHARGES_ORDERLINE;
      this.isResourceAllowedToAddChangeOrderCharges = BucSvcAngularStaticAppInfoFacadeUtil.canUserAccessResource(permissionToCheck);
   }
    getChargeDetails(charge){
      if(this.isLineLevel){
		if(this.isSaveAllChargesEnabled && (charge.newRow || charge.isRowEdited)){
            return charge.ChargeAmount;
        }
        if(charge.ChargeApplyTo === this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_UNIT']){
          return  charge.ChargePerUnit;
        }else if(charge.ChargeApplyTo === this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_LINE']){
          return  charge.ChargePerLine;
        }
      }else{
        return charge.ChargeAmount
      }
    }



  getChargeTypeList(chargeType = ''){
    this.chargeTypes = [];
    this.cTypes.forEach(cType=> {
        // the charge type option exists only when it has at least one charge name options
        if(this.remainChargeNamesForType[cType.code] > 0){
            this.chargeTypes.push(
                {
                    content:cType.content,
                    value :cType.code,
					selected: chargeType == cType.code
                }
            )
        }
    });

    return this.chargeTypes;
  }
  // Changes for OMS-83524 - Oct Minor FP - Start
  /*getChargeNameList(type) {
    this.chargeNameList = [];
  
    if (this.emptyChargeName?.ChargeNameList?.ChargeName?.length) {
      this.chargeNameList = this.emptyChargeName.ChargeNameList.ChargeName
        .filter((info: any) => info.ChargeCategory ===type)
        .map((info: any) => ({
          content: info.Description,
          value: info.ChargeName,
          data: info,
        }));
    }
  
    return this.chargeNameList;
  }*/
  getChargeNameList(discount, billable, chargeName = '') {
        this.chargeNameList = [];
            if(this.chargeInfoList){
              this.chargeNameList =  this.chargeInfoList.map(info=> {
                if(info && info.isDiscount === discount && info.isBillable === billable){
                  return {
                    content: info.desc !== '' ? info.desc : info.cName,
                    value: info.cName ,
                    data: info,
                    selected: chargeName == info.cName
                  }
                }
            });
            return this.chargeNameList = this.chargeNameList.filter(x=>x);
          }
    }
	// Changes for OMS-83524 - Oct Minor FP - End
    getApplyToList(value) {
        this.chargeApplyToList = [];
        const applyType = [
            this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_LINE'],
            this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_UNIT']
        ];
        applyType.forEach((element) => {
            this.chargeApplyToList.push({
                content: element,
                value: element,
                selected: value === element ? true : false
            });
        });
        return this.chargeApplyToList;
    }

    getChargesApplyTo(element) {
       if (parseFloat(element.ChargePerUnit)) {
            return this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_UNIT'];
        } else {
            return this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_LINE'];
        }
    }

    isManual(isManual, newRow) {
      return newRow ? true : isManual != 'Y' ? false : true;
    }

    changeInChargeType(event, index) {
        let changeValue: string = event;
        const changeKey = Constants.KEY_CHARGE_NAME;
		let isBillable = '';
        let isDiscount = '';
        let list = [];
        let categoryTypeList = [];
    
        this.selectedChargeType = event;
        this.model.data[index][2].data.isDisable = false;
    
        if (changeValue === "shipping") {
            if (!this.isLineLevel) {
                if (this.lineOrOrderStatus !== ExtensionConstants.EXTN_POSTSHIP) {
                    changeValue = 'billable';
                    categoryTypeList = this.chargeCategorys;
                    list = this.shippingChargeNameList;
					isBillable = 'Y';
            		isDiscount = 'N';
                }
            }
        } else if (changeValue === Constants.DISCOUNT_CODE) {
            if (this.isLineLevel) {
                this.model.data[index][4].data.isDisable = true;
                this.model.data[index][5].data.isDisable = false;
            }
    
            if (!BucBaseUtil.isVoid(this.discountCategory)) {
                if (this.isLineLevel) {
                    changeValue = ExtensionConstants.EXTN_DISCOUNT;
                    categoryTypeList = this.discountCategory;
                    list = this.allChargeNameList;
					isBillable = 'Y';
            		isDiscount = 'Y';
                } else {
                    if (this.lineOrOrderStatus !== ExtensionConstants.EXTN_PRESHIP) {
                        changeValue = ExtensionConstants.EXTN_DISCOUNT;
                        categoryTypeList = this.shippingDiscountCategory;
                        list = this.allChargeNameList;
						isBillable = 'Y';
            			isDiscount = 'Y';
                        this.extnAutoPopulateShippingDiscount(index);
                    }
                }
            }
        }
    
        // Update selectedChargePairs
        if (index < this.selectedChargePairs.length) {
            this.selectedChargePairs[index].chargeType = changeValue;
            this.selectedChargePairs[index].chargeName = null;
        } else {
            this.selectedChargePairs.push({
                chargeType: changeValue,
                chargeName: null
            });
        }
        if (this.isLineLevel) {
            this.lineChargeDetailsData.LineCharge[index].ChargeType = changeValue;
            this.lineChargeDetailsData.LineCharge[index].IsBillable = isBillable;
            this.lineChargeDetailsData.LineCharge[index].IsDiscount = isDiscount;
        } else {
            this.headerChargeDetailsData.HeaderCharge[index].ChargeType = changeValue;
            this.headerChargeDetailsData.HeaderCharge[index].IsBillable = isBillable;
            this.headerChargeDetailsData.HeaderCharge[index].IsDiscount = isDiscount;
        }
        // Apply filtered charge names
        const filteredList = this._filterSelectedChargeNames(list, changeValue);
		const resetList = this._markSelectedChargeOption(filteredList);
        this.model.data[index][0].data.value = changeValue;
        this.model.data[index][1].data.categoryTypeList = categoryTypeList;
        this.model.data[index][2].data.chargeNameList = resetList;
    }
    

    _filterSelectedChargType(list, chargeType){
        let results = []
        for (let i = 0; i < list.length; i++) {
            const rowData = list[i];
            let exists = false;
            for (let j = 0; j < this.selectedChargePairs.length; j++) {
                const chargePair = this.selectedChargePairs[j]
                if(chargePair.chargeType == chargeType && chargePair.chargeName == rowData.value){
                    exists = true;
                    break;
                }
            }
            if(!exists){
                results.push(rowData);
            }
        }
        return results;
    }


    changeInChargeNameList(event, index) {
        const keyChargeName = Constants.KEY_CHARGE_NAME;
        const keyChargeCategory = Constants.KEY_CHARGE_CATEGORY;
        const changeValue = event.item.value;
        const category = event.item.data.ChargeCategory;
		const description = event?.item?.data?.Description || event?.item?.content;
        
        this.selectedChargeName = event.item.content;
    
		const isPercentOffSelection = this.selectedChargeName === ExtensionConstants.EXTN_PERCENT_OFF;
    
        // Handle "Percent Off" case
        if (isPercentOffSelection) {
            for (let i = 0; i < index; i++) {
                this.model.data[i][4].data.isDisable = true; 
            }
            
            this.chargeHeaders.forEach(header => {
                if (header?.data === ExtensionConstants.EXTN_CHARGE_PERCENTAGE) {
                    header.visible = true; 
                    this.model.data[index][5].data.isDisable = true;
                    this.model.data[index][4].data.isDisable = false;
                }
            });
    
            this.cmbApplyTo = "CPU";
        } 
        else if (this.isLineLevel) {
			this._resetPercentOffState(index);
            this.model.data[index][5].data.isDisable = false;
    
            for (let i = 0; i <= index; i++) {
                const curChargePercentage = this.model.data[i][4].data.value;
                this.model.data[i][4].data.isDisable = true;
                const orderShippedStatus = 3700; 
                const maxLineStatus = Number(this.modalData?.lineDetails?.line?.MaxLineStatus) || 0; // Ensure it's a valid number
                
                if (!BucBaseUtil.isVoid(curChargePercentage) && maxLineStatus < orderShippedStatus) {
                    this.strChargePercentage = '';
                    this.model.data[i][4].data.isDisable = false;
                    this.model.data[i][5].data.isDisable = true;
                }
            }
        } 
        else {
			this._resetPercentOffState(index);
            this.model.data[index][5].data.isDisable = false;
            if (this.isManageChargeEnabled !== "Y") {
                this.cmbApplyTo = "";
            }    
            
        }
    
        // Auto-populate shipping discount if applicable
        if (this.isManageChargeEnabled === "Y" && 
            (changeValue === ExtensionConstants.EXTN_SHIPPING_DISCOUNT || changeValue === "WAIVING_SHIPPING_FEE")) {
            this.extnAutoPopulateShippingDiscount(index);
        }
    
        // Auto-populate return shipping fee if applicable
        if (this.isManageChargeEnabled === "Y" && changeValue === "REFUND_RETURN_SHIPPING_FEE") {
            this.extnAutoPopulateReturnShippingFee(index);
        }
    
        // Update selected charge pairs
        this.selectedChargePairs[index].chargeName = event.item.data.Description;
        this.remainChargeNamesForType[this.model.data[index][1].data.value] -= 1;
    
        // Check if charge options are exhausted
        if (this.remainChargeNamesForType[this.model.data[index][0].data.value] === 0) {
            this.ranOutOfChargeOptions = this.getChargeTypeList().length === 0;
        }
    
        // Update charge details based on line or header level
        if (this.isLineLevel) {
            this.lineChargeDetailsData.LineCharge[index].ChargeName = changeValue;
            this.lineChargeDetailsData.LineCharge[index].ChargeCategory = category;
			const existingChargeNameDetails = this.lineChargeDetailsData.LineCharge[index]?.ChargeNameDetails || {};
			this.lineChargeDetailsData.LineCharge[index].ChargeNameDetails = {
				...existingChargeNameDetails,
				Description: description
			};
            this.utilityLineCharge(keyChargeName, changeValue, index);
            this.utilityLineCharge(keyChargeCategory, category, index);
            this.model.data[index][3].data.isDisable = false;
            this.ChangeInApplyToField(event, index);
        } 
        else {
            this.headerChargeDetailsData.HeaderCharge[index].ChargeName = changeValue;
            this.headerChargeDetailsData.HeaderCharge[index].ChargeCategory = category;
			const existingChargeNameDetails = this.headerChargeDetailsData.HeaderCharge[index]?.ChargeNameDetails || {};
			this.headerChargeDetailsData.HeaderCharge[index].ChargeNameDetails = {
				...existingChargeNameDetails,
				Description: description
			};
            this.utilityHeaderCharge(keyChargeName, changeValue, index, category);
            this.model.data[index][5].data.isDisable = false;
        }
		
		
    }
	
	_resetPercentOffState(index: number) {
       this.disablePercentOff = true;
       this.disableChargeAmount = false;
       this.strChargePercentage = '';

       const row = this.model?.data?.[index];
       const percentCell = row && row[4] && row[4].data ? row[4].data : null;
       if (percentCell) {
           percentCell.value = '';
           if ('displayValue' in percentCell) {
               percentCell.displayValue = '';
           }
           percentCell.isDisable = true;
    }
    
       const amountCell = row && row[5] && row[5].data ? row[5].data : null;
       if (amountCell) {
           amountCell.isDisable = false;
       }

       if (this.isLineLevel) {
           const lineCharges = this.lineChargeDetailsData?.LineCharge;
           if (Array.isArray(lineCharges) && lineCharges[index]) {
               const charge = lineCharges[index];
               const currentExtn = charge.Extn || {};
               charge.Extn = {
                   ...currentExtn,
                   ExtnChargePercentage: ''
               };
               charge.ChargePercentage = '';
               this.utilityLineCharge(ExtensionConstants.EXTN_CHARGE_PERCENTAGE_CAMEL, '', index);
           }
       }
   }

    ChangeInApplyToField(event, data) {
        const changeKey = Constants.KEY_CHARGE_APPLYTO;
        const changeValue = ExtensionConstants.EXTN_CHARGE_PER_UNIT;
        const index= data;

        if(!this.lineChargeDetailsData.LineCharge[index].ChargeApplyTo || this.lineChargeDetailsData.LineCharge[index].ChargeApplyTo !== changeValue.toString()){
        const chargeAmount = this.getChargeDetails(this.lineChargeDetailsData.LineCharge[index]);
        this.lineChargeDetailsData.LineCharge[index].ChargeApplyTo = changeValue;
        this.utilityLineCharge(changeKey, changeValue, index);
        }
    }

    utilityHeaderCharge(changeKey, changeValue, index, category?) {
        const chargeCategoryKey= Constants.KEY_CHARGE_CATEGORY;
        const mappedKey = { id: index };
        if (this.newChargeDetails.HeaderCharge.length === 0) {
            const baseCharge = { ...this.headerChargeDetailsData.HeaderCharge[index], ...mappedKey };
			
			baseCharge[changeKey] = changeValue;
			this.newChargeDetails.HeaderCharge.push(baseCharge);
        } else if (this.newChargeDetails.HeaderCharge.length > 0) {
            const newChargeIndex = this.newChargeDetails.HeaderCharge.findIndex(obj => obj.id === index);
            if (newChargeIndex === -1) {
                const baseCharge = { ...this.headerChargeDetailsData.HeaderCharge[index], ...mappedKey };
				
				baseCharge[changeKey] = changeValue;
				this.newChargeDetails.HeaderCharge.push(baseCharge);
            } else {
              if(category && category!==this.newChargeDetails.HeaderCharge[newChargeIndex][chargeCategoryKey]){
                this.newChargeDetails.HeaderCharge[newChargeIndex][chargeCategoryKey] = category;
              }

                this.newChargeDetails.HeaderCharge[newChargeIndex][changeKey] = changeValue;
            }
        }
    }

    utilityLineCharge(changeKey, changeValue, index) {
        const mappedKey = { id: index };
        if (this.newChargeDetails.LineCharge.length === 0) {
			const baseCharge = { ...this.lineChargeDetailsData.LineCharge[index], ...mappedKey };
			
            baseCharge[changeKey] = changeValue;
			this.newChargeDetails.LineCharge.push(baseCharge);
        } else if (this.newChargeDetails.LineCharge.length > 0) {
            const newChargeIndex = this.newChargeDetails.LineCharge.findIndex(obj => obj.id === index);
            if (newChargeIndex === -1) {
                const baseCharge = { ...this.lineChargeDetailsData.LineCharge[index], ...mappedKey };
				
				baseCharge[changeKey] = changeValue;
				this.newChargeDetails.LineCharge.push(baseCharge);
            } else {
                this.newChargeDetails.LineCharge[newChargeIndex][changeKey] = changeValue;
            }
        }
    }

    isChargeAmountDisabled(item) {
        let disabled = true;
        if (this.isLineLevel) {
             item.ChargeName && item.ChargeApplyTo ? disabled = false : disabled = true;
        } else {
             item.ChargeName ? disabled = false : disabled = true;
        }
        return disabled;
    }

    changeInAmountField(data, value) {
      if (!value || !isNaN(value?.toString())) {
        const normalizedValue = value === undefined || value === null ? '' : value.toString();
        data.chargeAmountId = normalizedValue;
        this._cacheChargeAmount(data.index, normalizedValue);

        const shouldSendValue = normalizedValue === '' || !isNaN(Number(normalizedValue));
        this.amountChangedSub.next({
            index: data.index,
            value: shouldSendValue ? normalizedValue : undefined,
            chargeAmountId: data.chargeAmountId
        });
      }
    }

    async saveCharges(index, changeValue, chargeAmountId) {
      this.modifiedId = chargeAmountId;
      this.modifiedAmount = changeValue;
      this.modifiedIndex = index;
    
        const changeKey = Constants.KEY_CHARGE_AMOUNT;
        if (this.isLineLevel) {
            const chargeLine = this.lineChargeDetailsData.LineCharge[index];
            if (chargeLine.ChargeAmount !== changeValue || this.isApplyToChanged || this.hasOverrideError) {
                this.isApplyToChanged = false;
                this.lineChargeDetailsData.LineCharge[index].ChargeAmount = changeValue;
				if(this.isSaveAllChargesEnabled){
                    this.lineChargeDetailsData.LineCharge[index].isRowEdited = true;
                }
                this.utilityLineCharge(changeKey, changeValue, index);
                this.addLineCharges({
                    lineCharge: this.lineChargeDetailsData, index,
                    orderLineKey: this.orderLineKey, updateLine: true, newChargeDetails: this.newChargeDetails
                });
            }
        } else {
            const chargeAmountString = chargeAmountId.toString();
            let updatedIndex;
            if (chargeAmountString.includes('~')) {
                const chargeAmountArray = chargeAmountString.split('~');
                updatedIndex = (this.headerChargeDetailsData.HeaderCharge).findIndex(obj => obj.ChargeCategory === chargeAmountArray[1]);
            } else {
                updatedIndex = index;
            }
            const chargeLine = this.headerChargeDetailsData.HeaderCharge[updatedIndex];
            if (chargeLine?.ChargeAmount !== changeValue || this.hasOverrideError) {
                this.headerChargeDetailsData.HeaderCharge[updatedIndex].ChargeAmount = changeValue;
                this.utilityHeaderCharge(changeKey, changeValue, updatedIndex);

                this.addHeaderCharges({
                    headerCharge: this.headerChargeDetailsData, index: updatedIndex,
                    updateHeaderCharge: true, newChargeDetails: this.newChargeDetails
                });
               

            }
        }
    }
    chargeRemoveAction(index){
        if(this.isLineLevel){
            this.lineChargeDetailsData.LineCharge.splice(index, 1);
            this.newChargeDetails.LineCharge = this.newChargeDetails.LineCharge.filter(charge => charge.id !== index);
            if(this.newChargeDetails.LineCharge.length == 0){
                this.saveChargesEnabled = false;
            } else {
                this.saveChargesEnabled = true;
            }
        } else {
            this.headerChargeDetailsData.HeaderCharge.splice(index, 1);
            this.newChargeDetails.HeaderCharge = this.newChargeDetails.HeaderCharge.filter(charge => charge.id !== index);
            if(this.newChargeDetails.HeaderCharge.length == 0){
                this.saveChargesEnabled = false;
            } else {
                this.saveChargesEnabled = true;
            }
        }
        this.tableData();
    }
    addHeaderCharges(item) {
        this.headerCharges = item.headerCharge;
        this.newChargeDetails = item.newChargeDetails;
        if (item.updateHeaderCharge && !this.isSaveAllChargesEnabled) {
            this.addCharges(item.index);
        }else {
            this.saveChargesEnabled = true;
        }
    }

    addLineCharges(item) {
        this.lineCharges = item.lineCharge;
        this.orderLineKey = item.orderLineKey;
        this.newChargeDetails = item.newChargeDetails;
        if (item.updateLine && !this.isSaveAllChargesEnabled) {
            this.addCharges(item.index);
        }else {
            this.saveChargesEnabled = true;
        }
    }

    async addCharges(index) {
        this.hasOverrideError = false;
        let input = {
            OrderHeaderKey: this.orderHeaderKey,
        };
        let summaryChargeArray = [];
        if (this.isLineLevel) {
            if (this.newChargeDetails !== undefined) {
                summaryChargeArray = this.newChargeDetails.LineCharge.filter(charge => charge.id === index).map(lineCharge => ({
                    ChargeCategory: lineCharge.ChargeCategory,
                    ChargeName: lineCharge.ChargeName,
                     ChargePerLine: this.cmbApplyTo === 'CPL' ? lineCharge.ChargeAmount : '',
                     ChargePerUnit: this.cmbApplyTo !== 'CPL' ? lineCharge.ChargeAmount : '',
                        Extn: {
                            ExtnChargePercentage: this.strChargePercentage
                        }
                }));
               
                const lineCharges = {
                        OrderLines: {
                            OrderLine: [
                                {
                                    OrderLineKey: this.orderLineKey,
                                    LineCharges: {
                                        LineCharge: summaryChargeArray,
                                     },
                                  
                                }
                            ]
                    }
                   
                };
                if(!this.isDraftOrder){
                  const pendingChanges = { PendingChanges: { RecordPendingChanges: 'Y' } };
                  input = (this.violationOutput && Object.keys(this.violationOutput).length !== 0
                    && this.violationOutput.Violation.ApproverUserID) ? Object.assign(input, lineCharges, pendingChanges, this.violationOutput)
                    : input = Object.assign(input, lineCharges, pendingChanges);
                } else {
                  input = (this.violationOutput && Object.keys(this.violationOutput).length !== 0
                    && this.violationOutput.Violation.ApproverUserID) ? Object.assign(input, lineCharges, this.violationOutput)
                    : Object.assign(input, lineCharges);
                }

            }
        } else {
            if (this.newChargeDetails.HeaderCharge !== undefined) {
                summaryChargeArray = this.newChargeDetails.HeaderCharge.filter(charge => charge.id === index).map(headerCharge => ({
                    ChargeAmount: headerCharge.ChargeAmount,
                    ChargeCategory: headerCharge.ChargeCategory,
                    ChargeName: headerCharge.ChargeName
                }));
                const headercharges = {
                    HeaderCharges: {
                        HeaderCharge: summaryChargeArray
                    }
                };
                const pendingChanges = { PendingChanges: { RecordPendingChanges: 'Y' } };
                input = (this.violationOutput && Object.keys(this.violationOutput).length !== 0
                  && this.violationOutput.Violation.ApproverUserID) ? Object.assign(input, headercharges, pendingChanges, this.violationOutput)
                  : Object.assign(input, headercharges, pendingChanges);
            }
        }

         await this.extnValidateCustomCondition(input)
          if(this.onChangeApply){
            await this.adjustPricingDataService.addModifyCharges(input, this.isLineLevel, this.summaryDetails).then(async mashupOutput => {
                let getOrderLineListOutPut;
                this.flowOutput = mashupOutput; 
                //OMS -81738 start
                 if((mashupOutput?.Order?.RaiseAlertNeeded === 'Y')){
                    const err = "Manage Charge is not allowed in current status. Please respond to alert generated once order is shipped.";
                    this.showNotification(err); 
                    this.saveChargesEnabled = true;                   
                    this.disableChargeAmount = false; 
                    if(!BucBaseUtil.isVoid(mashupOutput?.Order.OrderLines.OrderLine[0]?.LineCharges?.LineCharge[0].Extn.ExtnChargePercentage)){
                         this.isLineLevel ? this.getOrderLineDetails(mashupOutput.Order?.OrderLines, true) :    
                       this.getOrderDetails(mashupOutput.Order);
                       this.tableData();
                    }
                  // this.isAnyChangeAppliedOnModal = true;
                   //OMS -81738  end                 
                   
                }
                
                // else if(mashupOutput?.Order && this.isLineLevel){
                //     const lineCharges = {
                //         OrderLine:{
                //             OrderLineKey: this.orderLineKey
                //         }
                //     };
                //     getOrderLineListOutPut= await this.adjustPricingDataService.getOrderLineList(lineCharges);
                // }
                //this.isLineLevel ? this.getOrderLineDetails(getOrderLineListOutPut.OrderLineList, true) :
               else{
                this.isLineLevel ? this.getOrderLineDetails(mashupOutput.Order?.OrderLines, true) :    
                this.getOrderDetails(mashupOutput.Order);
                    this.tableData();
                    this.saveChargesEnabled = true;
                    this.isAnyChangeAppliedOnModal = true;
               }
              
                    
                  }, mashupError => {
                    this.showManagerIDField = mashupError.showManagerIDField;
                    this.violationOutput = mashupError.violation;
                    this.showNotification(mashupError.errorMsg);
                    this.hasOverrideError = true;
                    this.managerID = mashupError.showManagerIDField ? this.managerID : '';
                  });
          }
            
    }
    async saveAllCharges(){
        this.hasOverrideError = false;
        let noteDetail = {};
        const loginUserId = BucSvcAngularStaticAppInfoFacadeUtil.getOmsUserLoginId();
        let input = {
            OrderHeaderKey: this.orderHeaderKey,
            Action: this.note ? 'MODIFY' : ''
        };
        let summaryChargeArray = [];
        if (this.isLineLevel) {
            if (this.newChargeDetails !== undefined) {
                summaryChargeArray = this.newChargeDetails.LineCharge.map(lineCharge => ({
                    ChargeCategory: lineCharge.ChargeCategory,
                    ChargeName: lineCharge.ChargeName,
                    ChargePerLine: lineCharge.ChargeApplyTo ===
                        this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_LINE'] ? lineCharge.ChargeAmount : '',
                    ChargePerUnit: lineCharge.ChargeApplyTo ===
                        this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_UNIT'] ? lineCharge.ChargeAmount : ''
                }));
                if(this.note){
                    noteDetail = {
                        Note: {
                            NoteText: this.note,
                            Createuserid: loginUserId,
                            Modifyuserid: loginUserId
                        }
                    }
                }
                const lineCharges = {
                    OrderLines: {
                        OrderLine: [
                            {
                                OrderLineKey: this.orderLineKey,
                                LineCharges: {
                                    LineCharge: summaryChargeArray
                                },
                                Notes: noteDetail
                            }
                        ]
                    }
                };
                input = (this.violationOutput && Object.keys(this.violationOutput).length !== 0
                && this.violationOutput.Violation.ApproverUserID) ? Object.assign(input, lineCharges, this.violationOutput)
                : Object.assign(input, lineCharges);

            }
        } else {
            if (this.newChargeDetails.HeaderCharge !== undefined) {
                summaryChargeArray = this.newChargeDetails.HeaderCharge.map(headerCharge => ({
                    ChargeAmount: headerCharge.ChargeAmount,
                    ChargeCategory: headerCharge.ChargeCategory,
                    ChargeName: headerCharge.ChargeName
                }));
                if(this.note){
                    noteDetail = {
                        Note: {
                            NoteText: this.note,
                            Createuserid: loginUserId,
                            Modifyuserid: loginUserId
                        }
                    }
                }
                const headercharges = {
                    HeaderCharges: {
                        HeaderCharge: summaryChargeArray,
                    },
                    Notes: noteDetail
                };
                input = (this.violationOutput && Object.keys(this.violationOutput).length !== 0
                  && this.violationOutput.Violation.ApproverUserID) ? Object.assign(input, headercharges, this.violationOutput)
                  : Object.assign(input, headercharges);
            }
        }
        await this.orderCommonService.saveAllCharges(input, this.isLineLevel, this.summaryDetails).then(() => {
            this.saveChargesEnabled = true;
            }, mashupError => {
            this.showManagerIDField = mashupError.showManagerIDField;
            this.violationOutput = mashupError.violation;
            this.showNotification(mashupError.errorMsg);
            this.hasOverrideError = true;
            this.managerID = mashupError.showManagerIDField ? this.managerID : '';
            });
    }
    groupByUtil(objectArray, property) {
        return objectArray?.sort((a, b) => {
            const x = a[property];
            const y = b[property];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }
    promoUpdated() {
       this.isPromoUpdated = true;
    }
    onSaveClick() {
        if(this.isSaveAllChargesEnabled){
            this.saveAction();
    	} else {
           if (!BucBaseUtil.isVoid(this.note)) {
            this.addNote();
        	} else {
            const err = "Note is empty. Please enter a note.";
            this.showNotification(err);
        	}
   	    }
    }
    
    async savePendingChanges(){ 
        let mashupOutput1 = this.flowOutput;
        let input : any;    
       //OMS -81738 start
        if(BucBaseUtil.isVoid(this.flowOutput.Order.RaiseAlertNeeded)) {
             input = {
                 Order: {
            OrderHeaderKey: this.orderHeaderKey,
                 }
        };

        }else{
        
        input= {
            Order: {
                OrderHeaderKey: this.orderHeaderKey,
                OrderNo: this.modalData.summaryDetails.OrderNo,
                OrderType : this.modalData.summaryDetails.OrderType,
                RaiseAlertNeeded: this.flowOutput.Order.RaiseAlertNeeded,
                AlertMessage: this.flowOutput.Order.AlertMessage,
                EnterpriseCode:this.modalData.summaryDetails.EnterpriseCode,
                 OrderLines: {
                    OrderLine: {
                        OrderLineKey: this.flowOutput.Order.OrderLines.OrderLine[0].OrderLineKey,
                      Notes:{
                        Note:{
                            NoteText : this.note
                        }
                      }
                    }

                 }
            }
        };
    }
    //OMS -81738 end
        await this.orderCommonService.savePendingChanges(input);
     }

    async discardPendingChanges(){
       const  input= {
         Order: {
          OrderHeaderKey: this.orderHeaderKey
         }
       }
              await this.orderCommonService.resetPendingChanges(input) ;
     }

    //OMS-81738
	async saveAction() {
		if(this.isSaveAllChargesEnabled){
            await this.saveAllCharges();
        }else{
        await this.savePendingChanges();
		}
        this.modalData.successCallback();
        this.closeModal();
         if(BucBaseUtil.isVoid(this.flowOutput.Order.RaiseAlertNeeded)) {
        const msg = this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_ADJUSTMENT_SAVED_MSG'];
        this.notificationService.notify({
            type: 'success',
            title: msg    });
        }else{
              const err = "Manage Charge is not allowed in current status. Please respond to alert generated once order is shipped.";
                    this. showNotification(err);
 
                     this.notificationService.notify({
            type: 'error',
            title: err    });
 
        }
    }

    private async _getNls(key, params?): Promise<any> {
        return this.translate.get(key, params).toPromise();
    }

    async addNote() {
        let noteDetail;
        const loginUserId = BucSvcAngularStaticAppInfoFacadeUtil.getOmsUserLoginId();
        if (this.isLineLevel) {
            noteDetail = {
                Order: {
                    OrderHeaderKey: this.orderHeaderKey,
                    OrderLines: {
                        OrderLine: [
                            {
                                OrderLineKey: this.orderLineKey,
                                Notes: {
                                    Note: {
                                        NoteText: this.note,
                                        Createuserid: loginUserId,
                                        Modifyuserid: loginUserId,
                                        ReasonCode:"YCD_ADD_MODIFY_CHARGES" 
                                    }
                                }
                            }
                        ]
                    }
                }
            };
        } else {
            noteDetail = {
                Order: {
                    OrderHeaderKey: this.orderHeaderKey,
                    Notes: {
                        Note: {
                            NoteText: this.note,
                            Createuserid: loginUserId,
                            Modifyuserid: loginUserId,
                            ReasonCode:"YCD_ADD_MODIFY_CHARGES" 
                        }
                    }
                }
            };
        }

            this.isLineLevel ?
                await this.orderCommonService.addOrderlineNote(noteDetail) : await this.orderCommonService.addNote(noteDetail);
            this.saveAction();
    }

    onNoteChange() {
        if (!this.isAnyChangeAppliedOnModal) {
            this.note ? this.saveChargesEnabled = true : this.saveChargesEnabled = false;
        }
    }

    onManagerIDChange() {
      setTimeout(() => {
        if (this.managerID) {
          this.violationOutput.Violation.ApproverUserID = this.managerID;
          this.amountChangedSub.next({ index: this.modifiedIndex, value: this.modifiedAmount, chargeAmountId: this.modifiedId });
          }
        }, 1000);
    }

    async onCloseModalClick() {
	  if (this.isSaveAllChargesEnabled) {
            if(this.isPromoUpdated) {
                 this.modalData.successCallback();
            }
            this.closeModal();
        } else {
      if(this.isAnyChangeAppliedOnModal && !this.isDraftOrder){
        await this.discardPendingChanges();
      }
        this.closeModal();
	 }
    }

    ngOnDestroy() {
        this.amountSubscription.unsubscribe();
    }

    setFlags(flagData) {
        this.saveChargesEnabled = flagData.saveChargesEnabled;
        this.isAnyChangeAppliedOnModal = flagData.isAnyChangeAppliedOnModal;
        this._repopulateCharges(this.model.data, flagData.numPromotionApplied, flagData.removePromotionOperation);
    }

    onPromoError(errorMsg){
      this.showNotification(errorMsg);
    }

    showNotification(mashupError) {
      this.notificationObj = {
        type: 'error',
        title: mashupError,
        showClose: true,
        lowContrast: true
      };
      this.notificationShown = true;
    }

    closeNotification() {
      this.notificationShown = false;
    }

    async onDisplayChange(data, $event) {
      if ($event) {
        data.displayValue = $event;
      }
    }

    getChargeName(categoryName,chargeName,i){
        let name: any;
        this.allChargeNameList.filter((item) => {
              if ( item && item?.data?.ChargeCategory === categoryName && item?.data?.ChargeName === chargeName) {
                  name = item?.data?.Description;
              }
          });
          if (BucBaseUtil.isVoid(name)) {
            name = i?.ChargeNameDetails?.Description || i?.ChargeName;
        }
          return name;
    }

    _filterSelectedChargeNames(list, chargeType){
		if (!Array.isArray(list)) {
            return [];
        }
		const results = [];
        for (let i = 0; i < list.length; i++) {
            const rowData = list[i];
			if (!rowData) {
                continue;
            }
			
			const description = rowData?.data?.Description || rowData?.content;
            let exists = false;
            for (let j = 0; j < this.selectedChargePairs.length; j++) {
                const chargePair = this.selectedChargePairs[j]
                if(chargePair.chargeType === chargeType && chargePair.chargeName === description){
                    exists = true;
                    break;
                }
            }
            if(!exists){
                results.push({ ...rowData});
            }
        }
        return results;
    }

	_markSelectedChargeOption(list, selectedChargeValue?, selectedChargeDescription?) {
        if (!Array.isArray(list)) {
            return [];
        }

        return list.map(option => {
            const item = { ...option };
            const description = item?.data?.Description || item?.content;
            const value = item?.data?.ChargeName || item?.value;
            const isCurrentSelection = (!!selectedChargeValue && selectedChargeValue === value) ||
                (!!selectedChargeDescription && selectedChargeDescription === description);

            if (isCurrentSelection) {
                item.selected = true;
            } else if (item.selected) {
                item.selected = false;
            }

            return item;
        });
    }
	
	_cacheChargeAmount(index, amount) {
        const normalizedAmount = amount === undefined || amount === null ? '' : amount.toString();
		
		if (!this.isSaveAllChargesEnabled) { 
			const changeKey = Constants.KEY_CHARGE_AMOUNT; 
			if (this.isLineLevel) { 
				this.utilityLineCharge(changeKey, normalizedAmount, index); 
			} 
			else { 
				this.utilityHeaderCharge(changeKey, normalizedAmount, index); 
			}
			return; 
		}

        if (this.isLineLevel) {
            const lineCharges = this.lineChargeDetailsData?.LineCharge;
            if (!Array.isArray(lineCharges) || !lineCharges[index]) {
                return;
            }

            const charge = lineCharges[index];
            charge.ChargeAmount = normalizedAmount;

            const perLineLabel = this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_LINE']?.toUpperCase?.() || '';
            const chargeApplyTo = (charge.ChargeApplyTo || '').toString().toUpperCase();

            if (chargeApplyTo === 'CPL' || chargeApplyTo === perLineLabel) {
                charge.ChargePerLine = normalizedAmount;
                charge.ChargePerUnit = '';
            } else {
                charge.ChargePerUnit = normalizedAmount;
                charge.ChargePerLine = '';
            }

            this.utilityLineCharge(Constants.KEY_CHARGE_AMOUNT, normalizedAmount, index);
        } else {
            const headerCharges = this.headerChargeDetailsData?.HeaderCharge;
            if (!Array.isArray(headerCharges) || !headerCharges[index]) {
                return;
            }

            headerCharges[index].ChargeAmount = normalizedAmount;
            this.utilityHeaderCharge(Constants.KEY_CHARGE_AMOUNT, normalizedAmount, index);
        }
    }

    changeInChargeAddNewLine(){
        const newRow= this.model.data.length;
        const changeKey = Constants.KEY_CHARGE_NAME;
        const changeValue = ExtensionConstants.EXTN_DISCOUNT;
        // bookmarking the selected pairs
        if(newRow < this.selectedChargePairs.length){
            this.selectedChargePairs[newRow].chargeType = changeValue;
            this.selectedChargePairs[newRow].chargeName = null;
        }else{
            this.selectedChargePairs.push({
                chargeType: changeValue,
                chargeName: null
            });
        }
    }

    async extnInitializeMashup() {
        this.input = {
            CommonCode: {
                OrganizationCode:this.modalData.summaryDetails.EnterpriseCode,
          }
            };
            
        //OMS-77712 - Start
        await this.prepareOrgManageCharges();
        await this.prepareTwoStepApprovalMC();
        await this.prepareUserHierarchy();
        await this.prepareManageChargesForAPTOS();
        await this.prepareExceptionList();
       //OMS-77712 -End
    
       //OMS-77715- Start
       await this.prepareManageChargeCategory();
       await this.preparePostShipChargeNamesList();
       await this.preparePreShipChargeNamesList();
       await this.prepareRevisedManageCharges();
      //OMS-77715- End

       //OMS-77719 start
       
       this.getCommonCodeListGrpManageCharge = await this.adjustPricingDataService.tpGetCommonCodeListGrpManageCharge({CommonCode:{OrganizationCode: this.modalData.summaryDetails.EnterpriseCode,CodeType:"MANAGE_CHAR_RESTRICT"}});
       
      this.totalPreviousDiscount = await this.adjustPricingDataService.getTotalPreviousDiscount({OrderAudit:{OrderHeaderKey:this.orderHeaderKey ,Createuserid: BucSvcAngularStaticAppInfoFacadeUtil.getOmsUserLoginId()}});

      this.chargeCagetoryList = await this.adjustPricingDataService.getChargeCategoryList({ChargeCategory:{CallingOrganizationCode: this.modalData?.summaryDetails?.EnterpriseCode,DocumentType:this.modalData.summaryDetails.DocumentType}});

   //OMS-77719 end
   }

   //OMS-77716
   customInitialize() {
        this.lineOrOrderStatus = this.extnPreOrPostShipment();
        this.isManageChargeEnabled = this.extnCheckManageChargesEnabled();
       
    }
  
  
    extnChangeInPercentOffField(data, value) {
        
        if(!isNaN(value as any)){

        const index = data.index;
        const changeKey = ExtensionConstants.EXTN_CHARGE_PERCENTAGE_CAMEL;
        let changeValue = '';

        this.closeNotification();
        if (value === 0 || value === '0' || value === '' || value === null  || isNaN(value as any)) {
            this.model.data[index][4].data.value = 0;
            changeValue ='0';
        }else{
            changeValue = value?.toString();
            this.model.data[index][4].data.value = value; 
        }
        this.model.data[index][4].data.isDisable = false;
        this.strChargePercentage = changeValue;
    
		const targetLineCharge = this.lineChargeDetailsData.LineCharge[index];
		if (targetLineCharge) {
			const currentExtn = targetLineCharge.Extn || {};
			this.lineChargeDetailsData.LineCharge[index].Extn = {
				...currentExtn,
				ExtnChargePercentage: changeValue
			};
		}
    
        if (!this.lineChargeDetailsData.LineCharge[index].ChargePercentage ||
            this.lineChargeDetailsData.LineCharge[index].ChargePercentage !== changeValue) {
            
            const chargeAmount = this.getChargeDetails(this.lineChargeDetailsData.LineCharge[index]);
            this.lineChargeDetailsData.LineCharge[index].ChargePercentage = changeValue;
            this.utilityLineCharge(changeKey, changeValue, index);
            this.model.data[index][5].data.isDisable = true;
        }
    
        // Handle default Charge Name and Category if missing
        if (this.isLineLevel && BucBaseUtil.isVoid(this.selectedChargeName)) {
            const keyChargeName = Constants.KEY_CHARGE_NAME;
            const keyChargeCategory = Constants.KEY_CHARGE_CATEGORY;
            const chargeName = this.lineChargeDetailsData.LineCharge[index].ChargeName;
            const chargeCategory = this.lineChargeDetailsData.LineCharge[index].ChargeCategory;
    
            this.lineChargeDetailsData.LineCharge[index].ChargeName = chargeName;
            this.lineChargeDetailsData.LineCharge[index].ChargeCategory = chargeCategory;
    
            this.utilityLineCharge(keyChargeName, chargeName, index);
            this.utilityLineCharge(keyChargeCategory, chargeCategory, index);
    
            this.model.data[index][3].data.isDisable = false;
            this.ChangeInApplyToField(data, index);
        }
    
        let enteredChargePercentageStr = changeValue;

        if (!BucBaseUtil.isVoid(enteredChargePercentageStr)) {
            enteredChargePercentageStr = enteredChargePercentageStr.replace('%', '');
        }
        
        const percentageRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
        if (!percentageRegex.test(enteredChargePercentageStr)) {
            this.saveChargesEnabled = false;
            this.invalidMessage = "Invalid input";
            this.showNotification(this.invalidMessage);
            return;
        }
        
        const percentageValue = Number(enteredChargePercentageStr);
        
        if (percentageValue > 100) {
            this.saveChargesEnabled = false;
            this.invalidMessage = "Invalid input";
            this.showNotification(this.invalidMessage);
            return;
        }
        
        
    
        if (BucBaseUtil.isVoid(this.selectedChargeName)) {
            this.selectedChargeName = ExtensionConstants.EXTN_PERCENT_OFF;
        }
    
        if (isEqual(this.selectedChargeName, ExtensionConstants.EXTN_PERCENT_OFF)) {
            const enteredDiscountNumber = Number(enteredChargePercentageStr);
            if (enteredDiscountNumber > 100) {
                this.saveChargesEnabled = false;
                
                this.invalidMessage = "Invalid input";
                this. showNotification(this.invalidMessage)

                return;
            }
    
            this. extnChargePercentage = this.modalData?.lineDetails?.line?.LineCharges?.LineCharge
                ?.map(charge => charge?.Extn?.ExtnChargePercentage)
                ?.filter(value => typeof value === 'string')[0] || '';
    
            if ( !isEqual(this.extnChargePercentage, enteredChargePercentageStr)) {
                let percentageNumber = Number(enteredChargePercentageStr);
                let existingChargeAmountForPercentOff = Number(this.model.data[index][5].data.value) || 0;
                const discountedAmount = this.extnGetDiscountedAmount(percentageNumber, existingChargeAmountForPercentOff);
                
                this.txtChargeAmount = Number.isInteger(discountedAmount) 
                ? discountedAmount.toString() 
                : discountedAmount.toFixed(2);
                if (this.txtChargeAmount && Number(this.txtChargeAmount) >= 0) {
                    this.isApplyToChanged = true;
                    this._cacheChargeAmount(index, this.txtChargeAmount);
                    this.amountChangedSub.next({
                        index: index,
                        value: this.txtChargeAmount,
                        chargeAmountId: index,
                    });
                }
                this.chargeAmountVisibleReadOnly = true;
                this.saveChargesEnabled = true;
            } else {

                if ( isEqual(this.extnChargePercentage, enteredChargePercentageStr)) {
                    let percentageNumber = Number(enteredChargePercentageStr);
                    let existingChargeAmountForPercentOff = Number(this.model.data[index][5].data.value) || 0;
                    const discountedAmount = this.extnGetDiscountedAmount(percentageNumber, existingChargeAmountForPercentOff);
                    
                    this.txtChargeAmount = Number.isInteger(discountedAmount) 
                    ? discountedAmount.toString() 
                    : discountedAmount.toFixed(2);
                    if (this.txtChargeAmount && Number(this.txtChargeAmount) >= 0) {
                        this.isApplyToChanged = true;
                         //this.changeInAmountField(this.model.data[index][4].data, 0);
                        this.saveChargesEnabled = false;
						this._cacheChargeAmount(index, this.txtChargeAmount);
                        this.amountChangedSub.next({
                            index: index,
                            value: this.txtChargeAmount,
                            chargeAmountId: index,
                        });
                    }
                }
            }
        }
    }
    }
    
    extnGetDiscountedAmount(percentageNumber: number, existingChargeAmountForPercentOff: number): number {
        const orderedLineQty = Number(this.modalData?.lineDetails?.line?.OrderedQty) || 0;
        let lineTotalWithoutTax = Number(this.modalData?.lineDetails?.line?.LineOverallTotals?.LineTotalWithoutTax) || 0;
    
        lineTotalWithoutTax += (existingChargeAmountForPercentOff * orderedLineQty);
        return (lineTotalWithoutTax / orderedLineQty) * (percentageNumber / 100);
    }
    

    async prepareManageChargeCategory(){
        const mashupOut=await this.adjustPricingDataService.getManageChargeCategory(this.input)
    }
    async prepareExceptionList(){
        this.exceptionListOutput = await this.adjustPricingDataService.getExceptionList({Inbox:{OrderHeaderKey:this.orderHeaderKey}})
    }
     async prepareManageChargesForAPTOS(){
         this.isManageChargesDisabledListOutput =  await this.adjustPricingDataService.getManageChargesForAPTOS({
          CommonCode: {
            CodeType: "DISABLE_MC",
            CodeValue:this.modalData.summaryDetails.EntryType,
          }
        });

        this.getTwoStepApprovalModel = await this.adjustPricingDataService.getManageChargesForAPTOS({
          CommonCode: {
            CodeType: "TWO_STEP_APPROVAL_MC"
          }
        });
     }
    async prepareOrgManageCharges() {
        this.enabledEnterpriseModelList = await this.adjustPricingDataService.getOrgManageCharges({
            CommonCode: {
                CodeValue:  this.modalData?.summaryDetails?.EnterpriseCode
            }
          });
    }
    async preparePostShipChargeNamesList(){
        this. postShipChargeNamesListMashupOut=await this.adjustPricingDataService.getPostShipChargeNamesList(this.input)
    }
    async preparePreShipChargeNamesList(){
        this.preShipChargeNamesListMashupOut=await this.adjustPricingDataService.getPreShipChargeNamesList(this.input)
    }
    async prepareRevisedManageCharges(){
        try {
            const mashupOutput = await this.adjustPricingDataService.getRevisedManageCharges(this.input);
            this.revisedManageChargesList = makeUnique(getArray(get(mashupOutput, 'CommonCodeList.CommonCode')), 'CodeValue')
                  .map((item) => ({
                    CodeValue: item.CodeValue,
                    CodeShortDescription:item.CodeShortDescription
                  }));
          } catch (error) {
          }
    }
    
    async prepareTwoStepApprovalMC(){
        const mashupOut=await this.adjustPricingDataService.getTwoStepApprovalMC(this.input)
    }
    async prepareUserHierarchy(){
        this.userHierarchyOutput = await this.adjustPricingDataService.getUserHierarchy();
    }

    extnPreOrPostShipment(): string | null { 
        let isPreOrPostShipment: string | null = null;
        const minLineStatus = Number(this.modalData?.lineDetails?.line?.MinLineStatus);
        const maxOrderStatus = Number(this.modalData?.summaryDetails?.MaxOrderStatus);
        if (
          (!BucBaseUtil.isVoid(minLineStatus) && minLineStatus >= 3700) ||
          (!BucBaseUtil.isVoid(maxOrderStatus) && maxOrderStatus >= 3700)
        ) {
          isPreOrPostShipment = ExtensionConstants.EXTN_POSTSHIP;
        } else {
          isPreOrPostShipment =ExtensionConstants.EXTN_PRESHIP;
        }
        return isPreOrPostShipment;
      }
      
      extnCheckManageChargesEnabled(): string {
        let isCurrentEnterpriseEnabledManageCharges = 'N';
        const documentType = this.modalData?.summaryDetails?.DocumentType;
        const currentEnterpriseCode = this.modalData?.summaryDetails?.EnterpriseCode;
        const enabledEnterpriseModelList = this.enabledEnterpriseModelList?.CommonCodeList?.CommonCode;
        if ((!BucBaseUtil.isVoid(enabledEnterpriseModelList)) && documentType === "0001") {
          for (const enabledEnterprise of enabledEnterpriseModelList) {
            if (enabledEnterprise.CodeValue === currentEnterpriseCode) {
              isCurrentEnterpriseEnabledManageCharges = 'Y';
              break; 
            }
          }
        }
        return isCurrentEnterpriseEnabledManageCharges;
    }

      extnLoadApplyToData(): void {
        if (this.isManageChargeEnabled === 'Y') {
            this.cmbApplyToReadOnly = true;
         
        }
      }
  
         
    extnSetValidChargeNames(): void {
        const chargeNameList = this.emptyChargeName?.ChargeNameList?.ChargeName || [];
        const chargeCategory = this.currentChargeCategorys;
        let chargeNameModel: any = null;
        if (isEqual(this.lineOrOrderStatus, ExtensionConstants.EXTN_PRESHIP)) {
          chargeNameModel = this.preShipChargeNamesListMashupOut;
        } else if (isEqual(this.lineOrOrderStatus, ExtensionConstants.EXTN_POSTSHIP)) {
          chargeNameModel = this.postShipChargeNamesListMashupOut;
        }
        const codeValueTypes = chargeNameModel?.CommonCodeList?.CommonCode || [];
        const validChargeNames: any[] = [];
        const chargeNamesToDisplay: any[] = [];
        codeValueTypes.forEach((code: any) => {
          if (isEqual(code.CodeLongDescription, chargeCategory)) {
            validChargeNames.push(code);
          }
        });
      
        validChargeNames.forEach((validCharge) => {
          chargeNameList.forEach((charge) => {
            if (isEqual(charge.ChargeName, validCharge.CodeValue)) {
              chargeNamesToDisplay.push(charge);
            }
          });
        });

        this. modelForChargeNames = { ChargeNameList: { ChargeName: chargeNamesToDisplay } };
        this. tempModel = this.modelForChargeNames?.ChargeNameList?.ChargeName.filter((info: any) => info.ChargeCategory ===this.currentChargeCategorys)
        .map((info: any) => ({
          content: info.Description,
          value: info.ChargeName,
          data: info,
        }));
        if( this.currentChargeCategorys === "SHIPPING" && !this.isLineLevel){
            this.shippingChargeNameList = cloneDeep(this.tempModel);
        }else{
            this.allChargeNameList = cloneDeep(this.tempModel);

        }
        
    }
      
    extnSetChargeCategoryList(): any[] {
        if (!this.isLineLevel && isEqual(this.lineOrOrderStatus, ExtensionConstants.EXTN_POSTSHIP)) {
          return this.shippingDiscountCategory;
        } else if (this.isLineLevel) {
          return this.discountCategory;
        }
        return []; 
    }
      
    extnSetChargeCategoryName(i: any) {
        let name;
        if(i?.ChargeCategoryDetails?.Description){
          name = i?.ChargeCategoryDetails?.Description;
        }else{
            switch(i?.ChargeCategory){
                case 'SHIPPING_DISCOUNT':
                    name =ExtensionConstants.EXTN_SHIPPING_DISCOUNT;
                  break;
                case '37':
                case 'DISCOUNT': 
                        name = 'Discount';
                     break;
                case 'SHIPPING':
                    name =ExtensionConstants.EXTN_SHIPPING_LOWER;
                    break;
            }
            
        }
        return name;
    }

    extnEvaluation(i: any) {
        this.extnShowChargePercentage(i)
        this.extnLoadApplyToData();
        if(isEqual(this.isManageChargeEnabled,'Y')){ 
            this.extnRestrictModification(i);  
        }
        if (["Shipping Discount", "WAIVING_SHIPPING_FEE", "REFUND_RETURN_SHIPPING_FEE"].includes(i.ChargeName)) {
            this.disableChargeAmount = true;
          }
    }

    extnShowChargePercentage(i: any) {
        const isPercentOff = i?.ChargeNameDetails?.Description;
        if (isEqual(isPercentOff, ExtensionConstants.EXTN_PERCENT_OFF)) {
            this.disablePercentOff= true;
            this.disableChargeAmount= true;
            this.cmbApplyTo='CPU';
          if (isEqual(i.IsManual, 'N')) {
            this.disablePercentOff= true;
          } else {
            this.disablePercentOff= false;
          }
        } else if(i?.Extn?.ExtnChargePercentage && i?.ChargeName=='34'){
            this.disablePercentOff= false;
            this.disableChargeAmount= true;
        }else {
            this.disablePercentOff= true;
            this.disableChargeAmount= false;
        }
    }
  
    extnRestrictModification(i){
        if(this.isLineLevel){      
            let maxLineStatus = 0;
            let maxLst=0;
            const orderShippedStatus = 3700; 
                maxLineStatus = this.modalData.lineDetails.line.MaxLineStatus;
                let appliedDiscount = this.modalData.lineDetails.line.LineOverallTotals.Discount;
             if (!BucBaseUtil.isVoid(maxLineStatus) && !BucBaseUtil.isVoid(appliedDiscount)) {
                maxLst = Number(maxLineStatus);
                if (maxLst >= orderShippedStatus) {
                    this.disablePercentOff= true;
                    this.disableChargeAmount= true;
		    //OMS-81997 START
                    // if(this.exitChargeNameKey){
                    //    this. extnFilterSelectedChargeNameKey(i)
                    // }
		    //OMS-81997 END
                }
          }
        }
        if(isEqual(i.ChargeName, ExtensionConstants.EXTN_REFUND_RETURN_SHIPPING_FEE_LOWER)) {
            this.disableChargeAmount=true;
         }
    }

    extnFilterSelectedChargeNameKey(dataList) {
        let results = [];
        let exists = false; // Define exists before using
    
        for (let j = 0; j < this.exitChargeNameKey.length; j++) {
            const chargePair = this.exitChargeNameKey[j];
    
            if (chargePair.ChargeNameKey === dataList?.ChargeNameKey) { 
                this.disableChargeAmount = true;
                exists = true; // Mark as found
                break;
            }
        }
    
        if (!exists) {
            results.push(dataList); // Push only if not found
            if(dataList?.Extn?.ExtnChargePercentage){
                this.disablePercentOff= false;
                this.disableChargeAmount = true;
            }
            else{
            this.disableChargeAmount = false;
	    //OMS-81997 START
             if(this.isLineLevel){      
            let maxLineStatus = 0;
            let maxLst=0;
            const orderShippedStatus = 3700; 
                maxLineStatus = this.modalData.lineDetails.line.MaxLineStatus;
                let appliedDiscount = this.modalData.lineDetails.line.LineOverallTotals.Discount;
             if (!BucBaseUtil.isVoid(maxLineStatus) && !BucBaseUtil.isVoid(appliedDiscount)) {
                maxLst = Number(maxLineStatus);
                if (maxLst >= orderShippedStatus) {
                    this.disablePercentOff= true;
                    this.disableChargeAmount= true;
                   
                }
               }
             }
	     //OMS-81997 END
            }
        }
    
        return results;
    }
    
    
	
	extnGetApplyName(i) {
          const isPercentOff = i?.ChargeNameDetails?.Description;
          let ChargeApplyTo=i.ChargeApplyTo;
          if (isEqual(isPercentOff, ExtensionConstants.EXTN_PERCENT_OFF)) {
              ChargeApplyTo=this.nlsMap['ORDER_PRICING_SUMMARY.ADJUST_PRICING_MODAL.LABEL_CHARGE_PER_UNIT'];
          }
          return ChargeApplyTo
    }

      extnAutoPopulateShippingDiscount(index): void {
        let chargeAmount = '0.00';
        const headerChargesList = this.modalData?.summaryDetails?.HeaderCharges?.HeaderCharge || [];
      
        if (headerChargesList.length > 0) {
          for (const charge of headerChargesList) {
            const chargeName = charge?.ChargeName;
      
            if (isEqual(chargeName, ExtensionConstants.EXTN_SHIPPING_LOWER)) {
              chargeAmount = charge?.ChargeAmount || '0.00';
              break;
            }
          }
        }
		this._cacheChargeAmount(index, chargeAmount);
        this.amountChangedSub.next({ index:index, value:chargeAmount, chargeAmountId: index });
        this.model.data[index][5].data.isDisable = true;
        this.saveChargesEnabled=true;
      }
      
      async extnAutoPopulateReturnShippingFee(index): Promise<void> {
        let ShippingCost = 0.00;
        let ShippingTax = 0.00;
        this.enterpriseCode = this.modalData.summaryDetails.EnterpriseCode;
        this.sellerOrgCode = this.modalData.summaryDetails.SellerOrganizationCode;
        const entryType = this.modalData.summaryDetails.EntryType;

        const input={
            TprReturnShippingFee:{
                EnterpriseCode:this.enterpriseCode
            }

        };
        this.returnShippingFeeList=await this.adjustPricingDataService.getReturnShippingFee(input)
        
        if (this.enterpriseCode.startsWith("COACH_") && (isEqual(entryType, "Store"))) {
            this.sellerOrgCode = this.enterpriseCode+ExtensionConstants.EXTN_RETL_OUTLET;
        }
    
        //Removing TprReturnShippingFeeModel for OMS-82280
        const retShipFeeList = this.returnShippingFeeList?.TprReturnShippingFeeList?.TprReturnShippingFee;
    
        if (!BucBaseUtil.isVoid(retShipFeeList)) {
            const len = retShipFeeList.length;
    
            if (this.sellerOrgCode.startsWith("COACH_") || this.sellerOrgCode.startsWith("SW_") || this.sellerOrgCode.startsWith("KS_")) {
                for (let i = 0; i < len; i++) {
                    const SellerOrganizationCode = retShipFeeList[i].SellerOrganizationCode;
    
                    if (isEqual(SellerOrganizationCode, this.sellerOrgCode)) {
                        ShippingCost =  Number(retShipFeeList[i].ShippingCost);
                        ShippingTax = Number(retShipFeeList[i].ShippingTax);
                        break;
                    } else if (isEqual(SellerOrganizationCode, this.enterpriseCode)) {
                        ShippingCost =  Number(retShipFeeList[i].ShippingCost);
                        ShippingTax = Number(retShipFeeList[i].ShippingTax);
                    } else {
                        ShippingCost =  Number(retShipFeeList[i].ShippingCost);
                        ShippingTax = Number(retShipFeeList[i].ShippingTax);
                    }
                }
            } else {
                for (let i = 0; i < len; i++) {
                    const SellerOrganizationCode = retShipFeeList[i].SellerOrganizationCode;
    
                    if (isEqual(SellerOrganizationCode, this. enterpriseCode)) {
                        ShippingCost =  Number(retShipFeeList[i].ShippingCost);
                        ShippingTax = Number(retShipFeeList[i].ShippingTax);
                        break;
                    } else {
                        ShippingCost =  Number(retShipFeeList[i].ShippingCost);
                        ShippingTax = Number(retShipFeeList[i].ShippingTax);
                    }
                }
            }
        }
    
        const totalShippingAmount = Number(ShippingCost) + Number(ShippingTax);
    
        this._cacheChargeAmount(index, String(totalShippingAmount));
        this.amountChangedSub.next({ index:index, value:String(totalShippingAmount), chargeAmountId: index });
        this.model.data[index][5].data.isDisable = true;
        
        this.saveChargesEnabled=true;
    }
     

    
    //OMS-77719 start
    isManageChargesAlertApplied(): string {
        const getExceptionsModel = this.exceptionListOutput;
        const exceptionList = getExceptionsModel?.InboxList?.Inbox || [];
        let alertFlag = 'N';
        let msg = '';
        const exceptionListLength = getExceptionsModel?.InboxList?.TotalNumberOfRecords || 0;
    
        for (let i = 0; i < exceptionListLength; i++) {
          const exceptionType = exceptionList[i].ExceptionType;
          const status = exceptionList[i].Status;
          if (exceptionType.includes('MANAGE CHARGE') && status !== 'CLOSED') {
            alertFlag = 'Y';
            msg = `Unable to make additional adjustments to this order until existing manage charge request ${exceptionType} is approved by Manager.`;
          }
        }
        if (alertFlag === 'Y') {
             this. showNotification(msg)
             this.onChangeApply=false;
        }
        return alertFlag;
    }
    //OMS-77719 end


    //OMS-77719 start
    async waiveReturnShippingTax(item){
        const orderDetailsModel = this.modalData;
        const enterpriseCode = orderDetailsModel?.summaryDetails?.EnterpriseCode;
        const documentType = orderDetailsModel?.summaryDetails?.DocumentType;
        const orderHeaderKey = orderDetailsModel?.summaryDetails?.OrderHeaderKey;
        
        if (['COACH_US', 'COACH_CA', 'SW_US', 'SW_CA', 'KS_US', 'KS_CA'].includes(enterpriseCode) && documentType === '0003') {
          //const targetModel = this.getTargetModel('getCompleteOrderDetails_input', { dynamicRepeatingPanel: true });
          //const headerChargesList = orderDetailsModel?.summaryDetails?.HeaderCharges?.HeaderCharge || [];
          this. headerCharges = this.isLineLevel ? item?.OrderLines?.OrderLine[0]?.LineCharges?.LineCharge : item?.HeaderCharges?.HeaderCharge ;

          let chargeName = this.headerCharges[0]?.ChargeName || '';
          let chargeCategory = this.headerCharges[0]?.ChargeCategory || '';
          let chargeAmount: number = this.isLineLevel ?this.headerCharges[0].ChargePerUnit : this.headerCharges[0].ChargeAmount;

            if(this.headerCharges){
                    if (chargeCategory === 'RETURN_SHIPPING' && chargeName === 'RETURN_SHIPPING_FEE' && chargeAmount === 0) {
                        const headerTaxList = orderDetailsModel?.summaryDetails?.HeaderTaxes?.HeaderTax || [];
              
                        if(headerTaxList){
                             for (const tax of headerTaxList) {
                                if (tax.TaxName === 'Return Shipping Tax') {
                                    const changeOrderInput = {
                                        Order: {
                                            OrderHeaderKey: orderHeaderKey,
                                            HeaderTaxes: {
                                            HeaderTax: {
                                                Tax: '0.00',
                                                TaxName: 'Return Shipping Tax',
                                                TaxNameDescription: "Return Shipping Tax",
                                                ChargeCategory: 'RETURN_SHIPPING',
                                                ChargeName: 'RETURN_SHIPPING_TAX',
                                            },
                                            },
                                        },
                                    };
                                    await this.adjustPricingDataService.changeOrder(changeOrderInput)
                                    break;
                                }
                            }
                        }
                    
                }
            }
        }
    }
    //OMS-77719 end


    //OMS-77719 start
    async checkUserLimitExceeded(item) {

        this.isResourceAllowedToAddChangeOrderCharges =true
        const orderDetails = this.modalData;
        let currentEnterpriseCode = orderDetails?.summaryDetails?.EnterpriseCode;
        let documentType = orderDetails?.summaryDetails?.DocumentType;
        let enabledEnterpriseList = this.enabledEnterpriseModelList?.CommonCodeList?.CommonCode || [];
        let isCurrentUserEnabledForTwoStepApproval;
        let isCurrentEnterpriseEnabledManageCharges = enabledEnterpriseList.some((item: any) => item.CodeValue === currentEnterpriseCode) ? 'Y' : 'N';
        if (isCurrentEnterpriseEnabledManageCharges === 'Y' && documentType === '0001') {
            let headerChargesList = this.isLineLevel?item?.OrderLines?.OrderLine[0]?.LineCharges?.LineCharge:item?.HeaderCharges?.HeaderCharge;
            let charge: any[] = [];  // Store updated charges
            for (let i = 0; i < this.allChargeList.length; i++) {
                const rowData = this.allChargeList[i];
                let exists = false;
                for (let j = 0; j < headerChargesList.length; j++) {
                    const chargePair = headerChargesList[j];
                    if (chargePair.ChargeName === rowData.ChargeName) {
                        exists = true;
                        charge.push({
                            ChargeAmount:this.isLineLevel? chargePair.ChargePerUnit : chargePair.ChargeAmount ,
                            ChargeCategory: chargePair.ChargeCategory || "",
                            ChargeName: chargePair.ChargeName, 
                            ChargePerLine: chargePair.ChargePerLine || "",
                            ChargePerUnit: chargePair.ChargePerUnit || "",
                        });
                        break;  // Exit inner loop after finding a match
                    }
                }
                if (!exists) {
                    // If ChargeName is not found, add new charge
                    charge.push({
                        ChargeAmount:this.isLineLevel? rowData.ChargePerUnit : rowData.ChargeAmount ,
                        ChargeCategory: rowData.ChargeCategory || "",
                        ChargeName: rowData.ChargeName,
                        ChargePerLine: rowData.ChargePerLine || "",
                        ChargePerUnit: rowData.ChargePerUnit || "",
                    });
                }
            }
            let chargeList = charge;
            let newModifiedTotalDiscountAmount = 0;
            let exitingTotalDiscount = 0;
            let maxTotalLimit = 0;
            let isDiscountChargeCategoryPresent = false;
            let totalDiscountAppliedByUser = Number(this.totalPreviousDiscount?.OrderAudit?.OverallDiscount || 0);
            let chargeType='';
                for (let charge of chargeList) {
                    let chargeAmount =Number(charge?.ChargeAmount);
                    if (Number(charge?.ChargePerUnit) > 0) {
                        chargeType = "CPU";
                    } else if (Number(charge?.ChargePerLine) > 0) {
                        chargeType = "CPL";
                    }
                    if (BucBaseUtil.isVoid(chargeAmount) || BucBaseUtil.isVoid(chargeType)) continue;
            
                    let selectedChargeCategory = charge?.ChargeCategory;
                    let isDiscountChargeCategory = false;
                    isDiscountChargeCategory = await this.checkForDiscountChargeCategory(selectedChargeCategory);
                    
                    if (isDiscountChargeCategory) {
                        isDiscountChargeCategoryPresent = true;
            
                        if (chargeType === "CPL") {
                            let lineTotalDiscount =Number( orderDetails?.lineDetails?.line?.LineOverallTotals?.Discount) || 0;
                            let lineTotalShippingDiscount = Number(orderDetails?.lineDetails?.line?.LineOverallTotals?.ShippingDiscount) || 0;
                            exitingTotalDiscount = lineTotalDiscount + lineTotalShippingDiscount;
                            newModifiedTotalDiscountAmount += chargeAmount;
                            maxTotalLimit = Number(orderDetails?.lineDetails?.line?.LineOverallTotals?.LineTotalWithoutTax) || 0;
                        } 
                        else if (chargeType === "CPU") {
                            let orderedLineQty = Number(orderDetails?.lineDetails?.line?.OrderedQty)|| 0;
                            let lineTotalDiscount = Number(orderDetails?.lineDetails?.line?.LineOverallTotals?.Discount) || 0;
                            let lineTotalShippingDiscount = Number(orderDetails?.lineDetails?.line?.LineOverallTotals?.ShippingDiscount) || 0;
                            exitingTotalDiscount = lineTotalDiscount + lineTotalShippingDiscount;
                            newModifiedTotalDiscountAmount += (chargeAmount * orderedLineQty);
                            maxTotalLimit = Number(orderDetails?.lineDetails?.line?.LineOverallTotals?.LineTotalWithoutTax) || 0;
                        } 
                        else {
                            let orderHdrDiscount =Number( orderDetails?.summaryDetails?.OverallTotals?.HdrDiscount) || 0;
                            let orderHdrShippingDiscount = Number(orderDetails?.summaryDetails?.OverallTotals?.HdrShippingDiscount) || 0;
                            exitingTotalDiscount = orderHdrDiscount + orderHdrShippingDiscount;
                            newModifiedTotalDiscountAmount += chargeAmount;
                            let grandTotal = Number(orderDetails?.summaryDetails?.OverallTotals?.GrandTotal) || 0;
                            let grandTax = Number(orderDetails?.summaryDetails?.OverallTotals?.GrandTax) || 0;
                            maxTotalLimit = grandTotal - grandTax;
                        }
                    }
                }
    
            let totalDiscountToBeApplied = newModifiedTotalDiscountAmount - exitingTotalDiscount;   
            let totalExistingAndToBeAppliedDiscountByCurrentUser = totalDiscountToBeApplied + totalDiscountAppliedByUser;
            let curUserGroupModelList = this.userHierarchyOutput?.User?.UserGroupLists?.UserGroupList || [];
            let maxLimitAllowed = 0;
            let isUserHasNoLimit = false;
            let isUserPartOfAnyGroup = false;
    
            if(!BucBaseUtil.isVoid(curUserGroupModelList)){
                for (let userGroup of curUserGroupModelList) {
                    let curUsersGroupId = userGroup?.UsergroupId;
                    let enabledUserGroupList = this.getCommonCodeListGrpManageCharge?.CommonCodeList?.CommonCode || [];
                    
                    if(enabledUserGroupList){
                        for (let group of enabledUserGroupList) {
                            if (group.CodeValue === curUsersGroupId && group.OrganizationCode === currentEnterpriseCode) {
                            let configuredLimitValue = Number(group.CodeLongDescription || 0);
                            if (configuredLimitValue > maxLimitAllowed) {
                                maxLimitAllowed = configuredLimitValue;
                                isUserPartOfAnyGroup = true;
                            } else if (configuredLimitValue === 0) {
                                isUserHasNoLimit = true;
                                isUserPartOfAnyGroup = true;
                                break;
                            }
                            }
                        }
                    }
                }
            }

            if(!BucBaseUtil.isVoid(curUserGroupModelList)){
                const lengthOfCurUserGroupModelList = curUserGroupModelList.length;
                for (let j = 0; j < lengthOfCurUserGroupModelList; j++) {
                    const curUsersGroupId = curUserGroupModelList[j].UsergroupId;
                    const commonCodeList = this.getTwoStepApprovalModel?.CommonCodeList?.CommonCode || [];
                    isCurrentUserEnabledForTwoStepApproval = 'N';

                    for (let k = 0; k < commonCodeList.length; k++) {
                        const shortDesc = commonCodeList[k].CodeShortDescription;
                        const enabledUsersGroupId = commonCodeList[k].CodeValue;
                        const enabledEnterprise = commonCodeList[k].OrganizationCode;
                    
                        if (((enabledUsersGroupId===curUsersGroupId) && shortDesc==="Y") && enabledEnterprise === orderDetails?.summaryDetails?.EnterpriseCode) {
                            isCurrentUserEnabledForTwoStepApproval = 'Y';
                            break;
                        }
                    }
                }
            }


            if (isDiscountChargeCategoryPresent && isUserHasNoLimit && totalDiscountToBeApplied > maxTotalLimit){
                const errMsg = "Charge amount cannot exceed Order/OrderLine total."
                this. showNotification(errMsg)
                this.onChangeApply=false;
                return true;
            } 
            else if (isDiscountChargeCategoryPresent && !isUserPartOfAnyGroup) {
                const enabledUserGroupLimitModelList =  this.getCommonCodeListGrpManageCharge?.CommonCodeList?.CommonCode || [];
                if (enabledUserGroupLimitModelList.length > 0) {
                let smallestLimitFromEnabledUserGroupLimitModel = Infinity;
                    for (const model of enabledUserGroupLimitModelList) {
                        const eachLimit = Number(model.CodeLongDescription) || 0;
                        if (eachLimit < smallestLimitFromEnabledUserGroupLimitModel) {
                            if(smallestLimitFromEnabledUserGroupLimitModel !=0 && eachLimit !=0){
                                smallestLimitFromEnabledUserGroupLimitModel = eachLimit;
                            }
                            
                        }
                    }
                    if (totalDiscountToBeApplied > maxTotalLimit) {
                        const errMsg = "Charge amount cannot exceed Order/OrderLine total."
                        this. showNotification(errMsg)
                        this.onChangeApply=false;
                        return true;
                    } 
                    else if (
                        totalExistingAndToBeAppliedDiscountByCurrentUser >
                        smallestLimitFromEnabledUserGroupLimitModel
                    ) {
                        if (isCurrentUserEnabledForTwoStepApproval === 'Y') {
                            this.openApprovalPopup(item)
                            this.onChangeApply=false;
                           
                        } 
                        else {
                            let currencySymbol = '$';
                            if ([
                                'COACH_IT', 'COACH_DE', 'COACH_FR', 'COACH_ES', 'COACH_NL',
                                'COACH_IE', 'COACH_BE', 'COACH_AT', 'COACH_PT', 'KS_ES',
                                'KS_IT', 'KS_FR', 'KS_DE', 'KS_NL', 'KS_IE', 'KS_BE',
                                'KS_AT', 'KS_PT'].includes(currentEnterpriseCode)) {
                                currencySymbol = '€';
                            } 
                            else if (['KS_GB', 'COACH_GB'].includes(currentEnterpriseCode)) {
                                currencySymbol = '£';
                            }
                            const err1 = `Max limit has been exceeded. This user can give up to ${currencySymbol}`;
                            const err2 = smallestLimitFromEnabledUserGroupLimitModel.toString();
                            this. showNotification(`${err1} ${err2}`)
                            this.onChangeApply=false;
                        }
                        return true;
                    }
                }
            }
            else if (isDiscountChargeCategoryPresent && !isUserHasNoLimit) {
                if (totalDiscountToBeApplied > maxTotalLimit) {
                    const err1 = `Charge amount cannot exceed Order/OrderLine total.`;
                    this. showNotification(err1)
                    this.onChangeApply=false;
                    return true;
                } 
                else if (totalExistingAndToBeAppliedDiscountByCurrentUser > maxLimitAllowed) {
                    if (isCurrentUserEnabledForTwoStepApproval === 'Y') {
                        this.openApprovalPopup(item)
                        this.onChangeApply=false;
                       
                    } 
                    else {
                        let currencySymbol = '$';
                        if ([
                            'COACH_IT', 'COACH_DE', 'COACH_FR', 'COACH_ES', 'COACH_NL',
                            'COACH_IE', 'COACH_BE', 'COACH_AT', 'COACH_PT', 'KS_ES',
                            'KS_IT', 'KS_FR', 'KS_DE', 'KS_NL', 'KS_IE', 'KS_BE',
                            'KS_AT', 'KS_PT'].includes(currentEnterpriseCode)) {
                            currencySymbol = '€';
                        } 
                        else if (['KS_GB', 'COACH_GB'].includes(currentEnterpriseCode)) {
                            currencySymbol = '£';
                        }
                        const err1 = `Max limit has been exceeded. This user can give up to ${currencySymbol}`;
                        const err2 = maxLimitAllowed.toString();
                        this. showNotification(`${err1} ${err2}`)
                        this.onChangeApply=false;
                    }
                    return true;
                }
            }
            return false;
        }
    }
    //OMS-77719 end
    

    //OMS-77719 start
    async checkForDiscountChargeCategory(selectedChargeCategory: string) {
       
    
        const chargeCategoryList = this.chargeCagetoryList?.ChargeCategoryList.ChargeCategory;
    
        for (const chargeCategoryItem of chargeCategoryList) {
          const chargeCategory = chargeCategoryItem?.ChargeCategory;
          if (chargeCategory === selectedChargeCategory) {
            const isDiscountFlag = chargeCategoryItem?.IsDiscount;
            if(isDiscountFlag === 'Y'){
                return true;
            }
           
          }
        }
    
        return false;
    }
    //OMS-77719 end
    
    

    async extnValidateCustomCondition(item) {
        this.saveChargesEnabled=false;
        const taskInput = this.modalData;
        const entryType = taskInput.summaryDetails.EntryType;
        let restrictManageChargeFlag = 'N';
        let isManageChargeDisabled = null;
        let entryTypeCommonCode = null;
        const restrictedCommonCodeList = this.isManageChargesDisabledListOutput?.CommonCodeList?.CommonCode || [];
        
        if (!BucBaseUtil.isVoid(restrictedCommonCodeList)) {
            for (const code of restrictedCommonCodeList) {
                isManageChargeDisabled = code.CodeShortDescription;
                entryTypeCommonCode = code.CodeValue;
                if (entryType === entryTypeCommonCode && isManageChargeDisabled === 'Y') {
                  restrictManageChargeFlag = 'Y';
                  break;
                }
            }
        }

        if (restrictManageChargeFlag === 'Y') {
            const errMsg="Manage Charges for APTOS orders are restricted";
            this.showNotification(errMsg);
            this.onChangeApply=false;
            return;
        }

        const enterpriseCode = taskInput.summaryDetails.EnterpriseCode;

        //TODO CHECK ReturnOrders
        if (taskInput.summaryDetails.OverallTotals && taskInput.summaryDetails.ReturnOrders) {
            if (['COACH_US', 'COACH_CA', 'SW_US', 'SW_CA', 'KS_US', 'KS_CA'].includes(enterpriseCode)) {
                const totalAmount = Number(taskInput.summaryDetails.OverallTotals.GrandTotal); 
                const returnOrderArray = taskInput?.summaryDetails?.ReturnOrders?.ReturnOrder || [];
                let returnTotal = 0;
            
                for (const order of returnOrderArray) {
                  returnTotal += Number(order.OverallTotals.GrandTotal); 
                }
            
                let remainingAmount = Number((totalAmount - returnTotal).toFixed(2)); 
            
                if (remainingAmount <= 0) {
                  const errMsg = "Refund For this Sales Order is complete";
                  this.showNotification(errMsg);
                  this.onChangeApply=false;
                   return;
                } else {
                  let amountEntered = 0;
                //check
                 const hChargesList = taskInput.summaryDetails.HeaderCharges?.HeaderCharge || [];
            
                  for (const charge of hChargesList) {
                    amountEntered += Number(charge.ChargeAmount); 
                  }
            
                  if (amountEntered > remainingAmount) {
                    const errMsg = `Funds left in the sales order is $ ${remainingAmount}`;
                    this.showNotification(errMsg);
                    this.onChangeApply=false;
                    return;
                  }
                }
            }
        }
            
        let exchangeType = null;
        if (['COACH_US', 'KS_US', 'SW_US', 'COACH_CA', 'KS_CA', 'SW_CA'].includes(enterpriseCode)) {
            if (taskInput.summaryDetails.ExchangeType) {
                exchangeType = taskInput.summaryDetails.ExchangeType;
                if (exchangeType === 'REGULAR') {
                    const errMsg = "Manage Charges for Exchange order is restricted";
                    this.showNotification(errMsg);
                    this.onChangeApply=false;
                    return;
                }
            }
        }
        
        let alertFlag = this.isManageChargesAlertApplied();
        if (alertFlag === 'N') {
           let isUserLimitExceeded = true;
            isUserLimitExceeded = await this.checkUserLimitExceeded(item);
            this.waiveReturnShippingTax(item);
            if (!isUserLimitExceeded) {
             this.onChangeApply=true;
            }
        }
     }

    

    //OMS-77719 start
    
    openApprovalPopup(item){
      this.modalService.create({
          component: ManageChargePopUpComponent, 
          inputs: {
            modalData: {
                item: item,
                summaryDetails:this.modalData,
                mashupOutPut: {
                    getCommonCodeListGrpManageCharge: this.getCommonCodeListGrpManageCharge,
                    userHierarchyOutput: this.userHierarchyOutput
                }
            }
        }
      });
    }
    //OMS-77719 end



}

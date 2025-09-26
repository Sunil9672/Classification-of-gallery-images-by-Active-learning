var angularApp=angular.module("atomApp").controller("ipamODECtrl", ipamODECtrl);

angularApp.directive('fileModel', ['$parse', function ($parse) {
    return {
       restrict: 'A',
       link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;

          element.bind('change', function() {
             $scope.$apply(function() {
                modelSetter(scope, element[0].files[0]);
             });
          });
       }
    };
 }]);


angularApp.filter('queryTypeValidation',[ function() {
	return function (fieldData,queryType,subQueryType) {

		var array = [];

		if(queryType=="Range" || subQueryType=="Range") {

			angular.forEach(fieldData, function (field) {
				if(field.fieldtype=="date" || field.fieldtype=="integer" || field.fieldtype=="float" || field.fieldtype=="ip" || field.fieldtype=="long" || field.fieldtype=="double" )
					array.push(field);
			});
		}
		else if(queryType=="WildCard" || subQueryType=="WildCard"){

			angular.forEach(fieldData, function (field) {
				if(field.fieldtype=="string" || field.fieldtype=="keyword")
					array.push(field);
			});
		}
		else {
			angular.forEach(fieldData, function (field) { array.push(field); });
		}

		return array;
	}
}]);


angularApp.directive('odecellstyleth', function() {

	return {
		scope: false,
		link: function(scope, element, attrs) {

			var finalObj = scope.ipamODECtrl.finalData.find(item=> item.index == attrs.tableindex);

			var freezeIndex = finalObj.freezeIndex || 0;
			freezeIndex = freezeIndex > 4 ? 4 : freezeIndex;

			element.css('background', '#F5F5F6');

			// set header style
			if(freezeIndex && freezeIndex > Number(attrs.colnumber))
			{
				// freeze headers for vertical + horizontal scroll
				element.css('width', '160px');
				element.css('min-width', '160px');
				element.css('position', 'sticky');
				element.css('left', (160*(Number(attrs.colnumber)))+'px');
				element.css('z-index', 2);
				element.css('word-break', 'break-all');
				element.css('background', '#f3f3f4');

				if(Number(attrs.rownumber) === 0)
					element.css('height', '42px');

				if(Number(attrs.rownumber) === 0)
					element.css('top', '0px');
				else if(Number(attrs.rownumber) === 1)
					element.css('top', '42px');
			}
			else if(!freezeIndex || freezeIndex <= Number(attrs.colnumber))
			{
				// freeze headers for vertical scroll
				element.css('position', 'sticky');
				element.css('z-index', 1);
				element.css('word-break', 'break-all');

				if(Number(attrs.rownumber) === 0)
					element.css('height', '42px');

				if(Number(attrs.rownumber) === 0)
					element.css('top', '0px');
				else if(Number(attrs.rownumber) === 1)
					element.css('top', '42px');
			}

	    }
	}

});


angularApp.directive('odecellstyleaggrth', function() {

	return {
		scope: false,
		link: function(scope, element, attrs) {

			var finalObj = scope.ipamODECtrl.finalData.find(item=> item.index == attrs.tableindex);

			var freezeIndex = finalObj.freezeIndex || 0;
			freezeIndex = freezeIndex > 4 ? 4 : freezeIndex;

			element.css('background', '#F5F5F6');

			// set header style
			if(freezeIndex && freezeIndex > Number(attrs.colnumber))
			{
				// freeze headers for vertical + horizontal scroll
				element.css('width', '160px');
				element.css('min-width', '160px');
				element.css('position', 'sticky');
				element.css('left', (160*(Number(attrs.colnumber)))+'px');
				element.css('z-index', 1);
				element.css('word-break', 'break-all');
				element.css('height', '42px');
			}
			else if(!freezeIndex || freezeIndex <= Number(attrs.colnumber))
			{
				element.css('word-break', 'break-all');
				element.css('height', '42px');
			}

	    }
	}

});


angularApp.directive('odecellstyletd', function() {

	return {
		scope: false,
		link: function(scope, element, attrs) {

			var finalObj = scope.ipamODECtrl.finalData.find(item=> item.index == attrs.tableindex);

			var freezeIndex = finalObj.freezeIndex || 0;
			freezeIndex = freezeIndex > 4 ? 4 : freezeIndex;

			element.css('background', '#f9f9f9');

			// set header style
			if(freezeIndex && freezeIndex > Number(attrs.colnumber))
			{
				// freeze headers for vertical + horizontal scroll
				element.css('width', '160px');
				element.css('min-width', '160px');
				element.css('position', 'sticky');
				element.css('left', (160*(Number(attrs.colnumber)))+'px');
				element.css('z-index', 1);
				element.css('word-break', 'break-all');
				element.css('text-align', 'left');
			}

	    }
	}

});


ipamODECtrl.$inject = [ '$http', '$rootScope', '$interval','$cookieStore',
	'$timeout', '$q', '$scope' ,'$modal','$location', 'ATOMService',
	'SessionService','toaster','$mdDialog','$filter','ATOMCommonServices','$window','$route','$sce'];

function ipamODECtrl($http, $rootScope, $interval,$cookieStore, $timeout, $q,
		$scope, $modal,$location, ATOMService,SessionService,toaster,$mdDialog,$filter,ATOMCommonServices,$window,$route,$sce) {

	if(!$rootScope.globals || angular.equals({}, $rootScope.globals))
	{
		SessionService.resetGlobalUserData();
	} else {
		$rootScope.name=$rootScope.globals.currentUser.username;
		$rootScope.rolename=$rootScope.globals.currentUser.appData.roleName;
	}

	$rootScope.selectedModule="IPAMOnDemandExecution";
	$window.localStorage.setItem("currentHeader", "IPAM On Demand Execution");
	$rootScope.currentModule="IPM";
	$rootScope.currentSubModule="On Demand Execution";
	$window.scrollTo(0, 0);

	var ipamODECtrl = this;
	ipamODECtrl._ = window._;

	ipamODECtrl.isReadOnlyRole = !$rootScope.structuredRestriction['atom32.12']['Write'];

	ipamODECtrl.summaryEnabledRole = $rootScope.structuredRestriction['atom32.23'] && $rootScope.structuredRestriction['atom32.23']['Read'];

	window.onbeforeunload = function() {

		if(!angular.isUndefined($rootScope.globals)){
		if($rootScope.streamingFlag){
			return "Changes you made may not be saved.";
			}
		}
	}

	ipamODECtrl.search="";

	ipamODECtrl.breadcrumRedirect=function(){

		if($rootScope.streamingFlag) {
			ATOMService.showMessage('error','WARNING','You have to stop live stream in order to refresh the Page. ');
			return;
		}

		ipamODECtrl.initODE();
	}

	ipamODECtrl.redirectToDashboard=function(){

		if($rootScope.streamingFlag) {
			ATOMService.showMessage('error','WARNING','You have to stop live stream in order to visit Dashboard. ');
			return;
		}

		if($rootScope.structuredRestriction['atom32.10']['Read']|| $rootScope.structuredRestriction['atom32.10']['Write'] || $rootScope.structuredRestriction['atom32.10']['Delete'])
		{
			ATOMService.showMessage('success','',"Redirecting to IPM Dashboard..");
			$location.path('/ipamDashboard');
		}
		else
		{
			ATOMService.showMessage('error','ERROR',"Permission Denied. Please contact admin.");
		}
	}


	ipamODECtrl.initODE=function(){

		ipamODECtrl.search="";
		ipamODECtrl.showNECreationPanel = true;

		ipamODECtrl.crudOperation = "Create";
		ipamODECtrl.neEditIndex = -1;

		ipamODECtrl.nodeList = [];
		ipamODECtrl.circleList=[];
		
		ipamODECtrl.fieldNameList = [];
		ipamODECtrl.viewKpiList = [];
		ipamODECtrl.viewCounterCategoryList = [];
		ipamODECtrl.viewCounterNameList =[];
		ipamODECtrl.fieldNameList = [];
		ipamODECtrl.specificOptList=[true,false];
		ipamODECtrl.headerPositionList=["row","column"];
		ipamODECtrl.specificOptList=[true,false];

		ipamODECtrl.headerList = [];
		ipamODECtrl.categoryNameList = [];

		ipamODECtrl.showSubNeApplicableFlag = false;
		ipamODECtrl.subNeApplicable = false;
		ipamODECtrl.subNeList = [];
		ipamODECtrl.subNe = null;

		ipamODECtrl.nh = {};

		ipamODECtrl.kpiDeltaOperationTypeList = ['sum','average','min','max'];
		ipamODECtrl.fetchBusyList = ["busyHour"];

		ipamODECtrl.executionType = "SingleProduct";
		ipamODECtrl.nodeName = "";
		ipamODECtrl.jempCircle="";
		ipamODECtrl.aggregationOn = "";
		ipamODECtrl.rawCategoryViewList = [];
		ipamODECtrl.rawCategory = "";
		ipamODECtrl.isCategorySpecific = "false";
		ipamODECtrl.reportType = "";
		ipamODECtrl.headerType = "";
		ipamODECtrl.counterType = "";
		ipamODECtrl.headerPosition = "row";
		ipamODECtrl.aggregationList = [];

		ipamODECtrl.aggregationOperationType = "";
		ipamODECtrl.timeAscFlag = false;

		ipamODECtrl.totalExecFlag = false;
		ipamODECtrl.anomalyDashboard = false;
		ipamODECtrl.executionMode = 'Manual';

		ipamODECtrl.enableSupportingDashboard=Constants.Supporting_Dashboard_Setup_List.includes($rootScope.setupName);
		ipamODECtrl.transposeFlag = false;
		ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};
		ipamODECtrl.transposeFieldNameList = [];

		ipamODECtrl.summaryFlag = false;
		ipamODECtrl.summaryJSON = { "fieldName":null, "fieldPosition": null};
		ipamODECtrl.summaryFieldNameList = [];

		ipamODECtrl.attributesFlag = false;
		ipamODECtrl.hideEmptyAttribute = false;
		ipamODECtrl.attributeFieldName = null;
		ipamODECtrl.attributeHeaderName = null;
		ipamODECtrl.selectedAttributeValues = [];
		ipamODECtrl.attributeValueList = [];
		ipamODECtrl.viewAttributesList = [];
		ipamODECtrl.attributes = [];

		ipamODECtrl.dynamicQueryTypeList = ["Match","Terms","Range","Boolean","WildCard","Exist"];
		ipamODECtrl.dynamicQueryClauseList = ["Must", "MustNot", "Should"];
		ipamODECtrl.dynamicSubQueryTypeList = ["Match","Terms","Range","WildCard","Exist"];

		ipamODECtrl.timeSelectionType = null;
		ipamODECtrl.networkDayDiff = null;
		ipamODECtrl.customTimeRangeFilterTypes = ["Today","Last"];
		ipamODECtrl.customTimeRange = {
			filterType: null,
			customBucketSize: null,
			customBucketType: null
		}
		ipamODECtrl.selectiveDatesModel = "";
		ipamODECtrl.selectiveDates = [];
		ipamODECtrl.bucketType = null;
		ipamODECtrl.bucketSize = null;
		ipamODECtrl.hourInput = [];
		ipamODECtrl.hourList = [];
		ipamODECtrl.quarterInput = [];
		ipamODECtrl.quarterComboList = ipamODECtrl._.range(0,59,5);
		ipamODECtrl.bucketTypeList = ["Minutes","Hours","Days","Weeks","Months","Years"];
		ipamODECtrl.bucketSizeList = [];
		ipamODECtrl.setupBasedBucketSizeList = [];
		ipamODECtrl.bucketTypeMapping ={
				"Minutes":100,
				"Hours":100,
				"Days":60,
				"Weeks":52,
				"Months":12,
				"Years":2
		};
		ipamODECtrl.numberOfBucket = null;

		ipamODECtrl.offsetBucketType = null;
		ipamODECtrl.offsetBucketValue = null;
		ipamODECtrl.offsetBucketTypeList = ["Minutes","Hours","Days"];
		ipamODECtrl.offsetBucketMapping ={
				"Minutes":100,
				"Hours":100,
				"Days":60
		};

		ipamODECtrl.clickableCellsArr = ['Critical', 'Critical_anomaly','Major', 'Major_anomaly','Warning','Warning_anomaly', 'Minor_anomaly'];

		ipamODECtrl.networkElementList = [];

		ipamODECtrl.resetODEFormDate();

		if($scope.odeform) {
			$scope.odeform.$setUntouched();
			$scope.odeform.$setPristine();
		}

		ipamODECtrl.clearODEExecutionResult();
		ipamODECtrl.fetchCircleList();
		ipamODECtrl.setupBasedBucketSizeList = [];

		if(Constants.MinuteBucket_Setup_List1.includes($rootScope.setupName))
		{
			ipamODECtrl.setupBasedBucketSizeList = angular.copy(Constants.MinuteBucket_List1);
		}
		else if(Constants.MinuteBucket_Setup_List2.includes($rootScope.setupName))
		{
			ipamODECtrl.setupBasedBucketSizeList = angular.copy(Constants.MinuteBucket_List2);
		}

		var prePopulatedNEList = [];

		if($rootScope.isODERequestedFromDetailView && $rootScope.dataForODERequestedFromDetailView)
		{
			// If ODE requested from IPM Dashboard Detail View
			prePopulatedNEList = $rootScope.dataForODERequestedFromDetailView;
			delete $rootScope.isODERequestedFromDetailView;
			delete $rootScope.dataForODERequestedFromDetailView;
		}
		else if($rootScope.isODERequestedFromReportExecution && $rootScope.dataForODERequestedFromReportExecution)
		{
			// If ODE requested from IPM Report Execution
			prePopulatedNEList = $rootScope.dataForODERequestedFromReportExecution;
			delete $rootScope.isODERequestedFromReportExecution;
			delete $rootScope.dataForODERequestedFromReportExecution;
		}
		else if($rootScope.isODERequestedFromKPI && $rootScope.dataForODERequestedFromKPI)
		{
			var kpiData = $rootScope.dataForODERequestedFromKPI;
			ipamODECtrl.executionType = kpiData.executionType;
			ipamODECtrl.jempCircle=kpiData.jempCircle
			if(ipamODECtrl.executionType === 'SingleProduct')
			{
				ipamODECtrl.nodeName = kpiData.nodeName;
			}
			ipamODECtrl.reportType = 'Kpi';
			ipamODECtrl.resetODEFormDate();

			// fetch api data
			if(ipamODECtrl.executionType === 'SingleProduct')
				ipamODECtrl.clearODEData('Kpi');

			ipamODECtrl.headerList = kpiData.kpilist;

			delete $rootScope.isODERequestedFromKPI;
			delete $rootScope.dataForODERequestedFromKPI;
			ATOMService.showMessage('success',"","KPI details populated successfully.");
		}

		if(prePopulatedNEList && prePopulatedNEList.length)
		{
			ATOMService.showMessage('success',"","Network Element added Successfully. <br> Please click 'Execute' button to submit Execution Request.");

			prePopulatedNEList.forEach( el => {

				var ne = angular.copy(el);
				ne.totalExecFlag = ne.totalExecFlag ? true : false;

				ne.fiveMinuteFlag = ipamODECtrl.setupBasedBucketSizeList.includes(5);

				if(!ne.counter && ne.counter !== 0)
					ne.counter = 4;

				if(ne.aggregationOperationType === 'timeBasedAggregation')
				{
					if(ne.bucketType)
					{
						ne.counter = ipamODECtrl.getCounterValueUsingBucket(ne.bucketType, ne.bucketSize);
					}
					else if(ne.counter || ne.counter === 0)
					{
						ipamODECtrl.getBucketValueUsingCounter(ne.counter, ne);
					}
				}

				// populate aggregation data
				if(ne.aggregationList && ne.aggregationList.row && ne.aggregationList.row.length)
				{
					ne.aggregationList.row.forEach(aggr=> ipamODECtrl.prepareAndSyncSpecificList(aggr, true));
				}

				if(ne.attributes && ne.attributes.length)
				{
					if(typeof ne.attributes[0] === 'string')
					{
						ne.attributes = ne.attributes.map(attr => {return {'fieldName': attr, 'headerName': attr}});
					}
				}

				if(!ne.executionMode)
					ne.executionMode = 'Manual';

				if(ne.summaryFlag && !ipamODECtrl.summaryEnabledRole)
				{
					delete ne.summaryFlag;
					delete ne.summaryJSON;
				}

				// for reports
				if(ne.reportType === 'Counter' && !ne.counterType)
				{
					ne.counterType = 'selectedCounter';
				}

				// Time Interval Section
				if(!ne.timeSelectionType)
				{
					if(ne.executionMode === 'Manual')
						ne.timeSelectionType = 'timeInterval';
					else
						ne.timeSelectionType = 'none';
				}

				if(ne.timeSelectionType === 'pastNthDay' && (!ne.networkDayDiff && ne.networkDayDiff != 0))
				{
					ne.networkDayDiff = 0;
				}
				else if(ne.timeSelectionType === 'timeInterval')
				{
					// set time yesterday-today date
					ne.startTime = moment().subtract(1, 'days').set({'hour': 0, 'minute': 0, 'second': 0}).format("YYYY-MM-DD-HH:mm:ss");
					ne.endTime = moment().set({'hour': 0, 'minute': 0, 'second': 0}).format("YYYY-MM-DD-HH:mm:ss");
				}
				else if(ne.timeSelectionType === 'customTimeRange')
				{
					if(!ne.customTimeRange || !ne.customTimeRange.filterType)
					{
						ne.customTimeRange = {
							filterType: 'Today'
						}
					}

					if(ne.customTimeRange.filterType === 'Last' && (!ne.customTimeRange.customBucketType || (!ne.customTimeRange.customBucketSize && ne.customTimeRange.customBucketSize != 0)))
					{
						ne.customTimeRange = {
							filterType: 'Today'
						}
					}
				}

				ipamODECtrl.networkElementList.push(ne);
			});


			$timeout(function(){
				try {
					$('html,body').animate({scrollTop: $('#odeNodeList').offset().top - 200 }, "slow");
				} catch (error) {
					console.error(error);
				}
			},500);
		}

		window.scrollTo(0,0);

	}


	ipamODECtrl.executionTypeChangeForODE=function(){
		ipamODECtrl.clearODEData('ExecutionType');

		if(ipamODECtrl.executionType === "MultipleProduct") {
			ipamODECtrl.fetchODEFiledNameList();
		}
	}


	ipamODECtrl.getODENFList=function(){

		var queryString = "operation=getNodeNameList"; 
		var header = {
			"username":$rootScope.globals.currentUser.username,
		};

		ATOMCommonServices.getMethodForVProbe(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){
				if( response.AppData.type == "SUCCESS"){
					ipamODECtrl.nodeList = response.AppData.appdata.resultList;
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Node Name List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	if(angular.isUndefined($rootScope.groupName) || $rootScope.groupName == null) {
		var groupNameWatch = $scope.$watch('groupName', function(newValue, oldValue) {
			if(!angular.isUndefined(newValue)) {
				ipamODECtrl.getODENFList();
				groupNameWatch();
			}
		});
	}
	else {
		ipamODECtrl.getODENFList();
	}
	
	
	ipamODECtrl.fetchCircleList=function(){

		var queryString = "operation=getCircleList";
		var header = {
				"username": $rootScope.globals.currentUser.username
		};
		ipamODECtrl.circleList =[];
		ATOMCommonServices.commonPostMethod({},Constants.IPM_UTILITY_REQUESTS_CONTEXT,header,queryString).then(
				function successCallback(response){

					if(response.AppData.type == "SUCCESS"){
						ipamODECtrl.circleList = response.AppData.appdata.responseDescription.circle;
						if(ipamODECtrl.circleList  && ipamODECtrl.circleList.length){
							ipamODECtrl.circleList=['All',...ipamODECtrl.circleList]
						}
					}
					else
					{
						if(showErrorMessage)
							ATOMService.showMessage('error','WARNING','Unable to fetch circle list. Please contact admin. ');
					}

				},
				function errorCallback(responseData){

					ipamODECtrl.circleList = [];

					if(showErrorMessage)
						ATOMService.showMessage('error','ERROR','server is not reachable');
				});
	}


	ipamODECtrl.onODENodeNameChange=function(){

		if(ipamODECtrl.executionType === 'MultipleProduct')
		{

			ipamODECtrl.categoryName = "";
			ipamODECtrl.counterNameList = [];

			ipamODECtrl.categoryNameList = [];
			ipamODECtrl.viewCounterNameList = [];

			ipamODECtrl.viewKpiList = [];
			ipamODECtrl.kpiObject = null;
			ipamODECtrl.kpiHeader = null;

			if(ipamODECtrl.reportType === 'Counter' || (ipamODECtrl.reportType === 'Mixed' && ipamODECtrl.headerType === 'Counter')) {
				ipamODECtrl.nh = {};
				ipamODECtrl.showSubNeApplicableFlag = false;
				ipamODECtrl.subNeApplicable = false;
				ipamODECtrl.subNeList = [];
				ipamODECtrl.subNe = null;
				ipamODECtrl.getSubApplicableAndSubNeList();
				ipamODECtrl.getODECounterCategoryList();
				ipamODECtrl.resetODEFormDate();
			}
			else if(ipamODECtrl.reportType === 'Kpi' || (ipamODECtrl.reportType === 'Mixed' && ipamODECtrl.headerType === 'Kpi')) {
				ipamODECtrl.getODEKPIList();
			}
		}
		else {
			ipamODECtrl.clearODEData('nodeName');
		}

		// ipamODECtrl.getODEDataSourceNameList();
	}


	ipamODECtrl.getODEDataSourceNameList=function(){


		if(!ipamODECtrl.nodeName)
			return;

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"correlationDataType": "COUNTER",
			"productName": ipamODECtrl.nodeName
		};

		var queryString = 'operation=correlationDataSourceNameList';

		ATOMCommonServices.commonGetMethod(Constants.CorelationType_context, header, queryString).then(

			function successCallback(response){
				if( response.AppData.type == "SUCCESS"){

					ipamODECtrl.dataSourceNameList = response.AppData.appdata.correlationDataSourceNameList;

					if(!ipamODECtrl.dataSourceNameList || ipamODECtrl.dataSourceNameList.length==0)
					{
						ATOMService.showMessage('error','WARNING','Data Source Name List is empty.');
					}

				} else {
					ATOMService.showMessage('error','WARNING','Unable to fetch Data Source Name List. Please contact admin. ');
				}

			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.getODECounterCategoryList=function(){

		if(!ipamODECtrl.nodeName)
			return;

		var queryString = "operation=getCounterCategoryList"; 
		var header = {
			"username":$rootScope.globals.currentUser.username,
			"nodeName":ipamODECtrl.nodeName
		};

		ATOMCommonServices.getMethodForVProbe(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){
				if( response.AppData.type == "SUCCESS"){
					ipamODECtrl.counterCategoryListForDetailview=response.AppData.appdata.resultList;
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Category List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.clearODEData=function(type) {

		ipamODECtrl.search="";

		if(type === 'form' || type === 'nodeName' || type === 'ExecutionType') {

			if(type === 'form') {

				ipamODECtrl.assigneduser = [];
				ipamODECtrl.accessData = [];
				ipamODECtrl.createdBy = null;
				ipamODECtrl.userTag = null;
				ipamODECtrl.fileFormat = "excel";

				ipamODECtrl.dashboardName = "";
				ipamODECtrl.version = "";
				ipamODECtrl.nodeName = "";
				ipamODECtrl.jempCircle=""
				ipamODECtrl.executionType = "SingleProduct";
				ipamODECtrl.executionMode = 'Manual';

				ipamODECtrl.crudOperation = "Create";
				ipamODECtrl.neEditIndex = -1;

				ipamODECtrl.timeSelectionType = null;
				ipamODECtrl.networkDayDiff = null;
				ipamODECtrl.customTimeRange = {
					filterType: null,
					customBucketSize: null,
					customBucketType: null
				}
				ipamODECtrl.selectiveDates = [];
				ipamODECtrl.selectiveDatesModel = "";
				ipamODECtrl.bucketType = null;
				ipamODECtrl.bucketSize = null;
				ipamODECtrl.hourInput = [];
				ipamODECtrl.hourList = [];
				ipamODECtrl.quarterInput = [];
				ipamODECtrl.numberOfBucket = null;

				ipamODECtrl.offsetBucketType = null;
				ipamODECtrl.offsetBucketValue = null;
			}

			ipamODECtrl.dataSourceName = "";
			ipamODECtrl.dataSourceNameList = [];
			ipamODECtrl.aggregationOn = "";
			ipamODECtrl.headerPosition = "row";

			ipamODECtrl.showSubNeApplicableFlag = false;
			ipamODECtrl.subNeApplicable = false;
			ipamODECtrl.subNeList = [];
			ipamODECtrl.subNe = null;

			ipamODECtrl.headerFilterFlag = false;
			ipamODECtrl.headerFilterList = [];
			ipamODECtrl.dynamicFiltersFlag = false;
			ipamODECtrl.fieldData = [];
			ipamODECtrl.dynamicRawCategoryViewList = [];

			ipamODECtrl.supportingDashboardFlag = false;
			ipamODECtrl.uploadedFileDetails = {"uploadedFilePath": "", "filterList": "", "modeKpiName": ""};
			ipamODECtrl.fileContentForSDExcel = null;
			ipamODECtrl.fileStatusForSD = "File Not Uploaded";
			try{
				$("#sdFileUploadEl").val("");
			}
			catch (e) {
			}

			if($scope.odesupportingdashboardform) {
				$scope.odesupportingdashboardform.$setUntouched();
				$scope.odesupportingdashboardform.$setPristine();
			}

			if(type === 'ExecutionType') {
				ipamODECtrl.nodeName = "";
				ipamODECtrl.aggregationOn = ipamODECtrl.executionType === "SingleProduct" ? "" : "HNA";
			}

			ipamODECtrl.reportType = "";
			ipamODECtrl.headerType = "";
			ipamODECtrl.counterType = "";

			ipamODECtrl.viewCounterCategoryList = [];

			ipamODECtrl.counterType = "";
			ipamODECtrl.categoryNameList = [];

			ipamODECtrl.categoryName = "";
			ipamODECtrl.counterNameList = [];
			ipamODECtrl.viewCounterNameList = [];

			ipamODECtrl.viewKpiList = [];
			ipamODECtrl.headerList = [];

			ipamODECtrl.rawCategoryViewList = [];
			ipamODECtrl.rawCategory = "";
			ipamODECtrl.isCategorySpecific = "false";

			ipamODECtrl.fieldNameList = [];
			ipamODECtrl.fieldName = null;
			ipamODECtrl.size = null;

			ipamODECtrl.aggregationList = [];

			ipamODECtrl.aggregationOperationType = "";
			ipamODECtrl.timeAscFlag = false;

			ipamODECtrl.totalExecFlag = false;
			ipamODECtrl.anomalyDashboard = false;

			ipamODECtrl.transposeFlag = false;
			ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};
			ipamODECtrl.transposeFieldNameList = [];

			ipamODECtrl.summaryFlag = false;
			ipamODECtrl.summaryJSON = { "fieldName":null, "fieldPosition": null};
			ipamODECtrl.summaryFieldNameList = [];

			ipamODECtrl.attributesFlag = false;
			ipamODECtrl.hideEmptyAttribute = false;
			ipamODECtrl.attributeFieldName = null;
			ipamODECtrl.attributeHeaderName = null;
			ipamODECtrl.selectedAttributeValues = [];
			ipamODECtrl.attributeValueList = [];
			ipamODECtrl.viewAttributesList = [];
			ipamODECtrl.attributes = [];

			if(type === 'form') {
				ipamODECtrl.resetODEFormDate();
			}

			if($scope.odeform) {
				$scope.odeform.$setUntouched();
				$scope.odeform.$setPristine();
			}
		}
		else if(type === 'ExecutionMode')
		{
			ipamODECtrl.timeSelectionType = ipamODECtrl.executionMode === 'RealTime' ? 'none' : null;
			ipamODECtrl.networkDayDiff = null;
			ipamODECtrl.customTimeRange = {
				filterType: null,
				customBucketSize: null,
				customBucketType: null
			}
			ipamODECtrl.selectiveDates = [];
			ipamODECtrl.selectiveDatesModel = "";
		}
		else if(type === 'Kpi') {
			ipamODECtrl.headerType = "";
			ipamODECtrl.headerList = [];
			ipamODECtrl.counterType = "";
			ipamODECtrl.categoryNameList = [];
			ipamODECtrl.showSubNeApplicableFlag = false;
			ipamODECtrl.subNeApplicable = false;
			ipamODECtrl.subNeList = [];
			ipamODECtrl.subNe = null;
			ipamODECtrl.nh = {};
			ipamODECtrl.getODEKPIList();
			ipamODECtrl.resetODEFormDate();

			ipamODECtrl.headerFilterFlag = false;
			ipamODECtrl.headerFilterList = [];

//			ipamODECtrl.transposeFlag = false;
//			ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};
//			ipamODECtrl.transposeFieldNameList = [];

			ipamODECtrl.summaryFlag = false;
			ipamODECtrl.summaryJSON = { "fieldName":null, "fieldPosition": null};
			ipamODECtrl.summaryFieldNameList = [];
		}
		else if(type === 'Counter'){
			ipamODECtrl.headerType = "";
			ipamODECtrl.headerList = [];
			ipamODECtrl.showSubNeApplicableFlag = false;
			ipamODECtrl.subNeApplicable = false;
			ipamODECtrl.subNeList = [];
			ipamODECtrl.subNe = null;
			ipamODECtrl.nh = {};
			ipamODECtrl.getSubApplicableAndSubNeList();
			ipamODECtrl.getODECounterCategoryList();
			ipamODECtrl.resetODEFormDate();

			ipamODECtrl.headerFilterFlag = false;
			ipamODECtrl.headerFilterList = [];

//			ipamODECtrl.transposeFlag = false;
//			ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};
//			ipamODECtrl.transposeFieldNameList = [];

			ipamODECtrl.summaryFlag = false;
			ipamODECtrl.summaryJSON = { "fieldName":null, "fieldPosition": null};
			ipamODECtrl.summaryFieldNameList = [];
		}
		else if(type === 'Mixed'){
			ipamODECtrl.headerType = "";
			ipamODECtrl.headerList = [];
			ipamODECtrl.counterType = "";
			ipamODECtrl.categoryNameList = [];
			ipamODECtrl.showSubNeApplicableFlag = false;
			ipamODECtrl.subNeApplicable = false;
			ipamODECtrl.subNeList = [];
			ipamODECtrl.subNe = null;
			ipamODECtrl.nh = {};
			ipamODECtrl.resetODEFormDate();

			ipamODECtrl.headerFilterFlag = false;
			ipamODECtrl.headerFilterList = [];

//			ipamODECtrl.transposeFlag = false;
//			ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};
//			ipamODECtrl.transposeFieldNameList = [];

			ipamODECtrl.summaryFlag = false;
			ipamODECtrl.summaryJSON = { "fieldName":null, "fieldPosition": null};
			ipamODECtrl.summaryFieldNameList = [];
		}
		else if(type === 'HeaderType-Kpi') {
			ipamODECtrl.counterType = "";
			ipamODECtrl.categoryNameList = [];
			ipamODECtrl.showSubNeApplicableFlag = false;
			ipamODECtrl.subNeApplicable = false;
			ipamODECtrl.subNeList = [];
			ipamODECtrl.subNe = null;
			ipamODECtrl.nh = {};
			ipamODECtrl.getODEKPIList();
		}
		else if(type === 'HeaderType-Counter'){
			ipamODECtrl.counterType = "selectedCounter";
			ipamODECtrl.nh = {};
			ipamODECtrl.showSubNeApplicableFlag = false;
			ipamODECtrl.subNeApplicable = false;
			ipamODECtrl.subNeList = [];
			ipamODECtrl.subNe = null;
			ipamODECtrl.getSubApplicableAndSubNeList();
			ipamODECtrl.getODECounterCategoryList();
		}
		else if(type === 'counterType' || type === 'subNeApplicable') {

			if(type === 'counterType')
			{
				ipamODECtrl.headerList = [];
				ipamODECtrl.headerFilterFlag = false;
				ipamODECtrl.headerFilterList = [];
			}

			ipamODECtrl.categoryNameList = [];

			ipamODECtrl.categoryName = "";
			ipamODECtrl.counterNameList = [];
			ipamODECtrl.viewCounterNameList = [];

			ipamODECtrl.nh = {};

			if(type === 'subNeApplicable')
			{
				ipamODECtrl.subNe = null;
				ipamODECtrl.viewCounterCategoryList = [];

				if(!ipamODECtrl.subNeApplicable)
				{
					ipamODECtrl.getODECounterCategoryList();
				}
			}
		}
		else if(type === 'SCH') {
			ipamODECtrl.fieldNameList = [];
			ipamODECtrl.fieldName = null;
			ipamODECtrl.size = null;

			ipamODECtrl.rawCategoryViewList = [];
			ipamODECtrl.rawCategory = "";
			ipamODECtrl.isCategorySpecific = "false";

			ipamODECtrl.aggregationList = [];
			ipamODECtrl.transposeFlag = false;
			ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};
			ipamODECtrl.transposeFieldNameList = [];

			ipamODECtrl.summaryFlag = false;
			ipamODECtrl.summaryJSON = { "fieldName":null, "fieldPosition": null};
			ipamODECtrl.summaryFieldNameList = [];

			ipamODECtrl.dynamicFiltersFlag = false;
			ipamODECtrl.fieldData = [];
			ipamODECtrl.dynamicRawCategoryViewList = [];
		}
		else if(type === 'aggregationOperationType') {

			ipamODECtrl.timeAscFlag = false;
			ipamODECtrl.transposeFlag = false;
			ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};
			
			ipamODECtrl.bucketType = null;
			ipamODECtrl.bucketSize = null;
			ipamODECtrl.numberOfBucket = null;

			ipamODECtrl.hourInput = [];
			ipamODECtrl.hourList = [];
			ipamODECtrl.quarterInput = [];
			ipamODECtrl.quarterComboList = [];

			ipamODECtrl.resetODEFormDate();
		}
		else if(type === 'headerPosition') {

			ipamODECtrl.transposeFlag = false;
			ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};

			ipamODECtrl.summaryFlag = false;
			ipamODECtrl.summaryJSON = { "fieldName":null, "fieldPosition": null};

			ipamODECtrl.attributesFlag = false;
			ipamODECtrl.hideEmptyAttribute = false;
			ipamODECtrl.attributes = [];

			ipamODECtrl.headerFilterFlag = false;
			ipamODECtrl.headerFilterList = [];

			if(ipamODECtrl.headerPosition === 'row')
			{
				
				if(ipamODECtrl.headerList.some(el=> el.deltaExecFlag))
				{
					ipamODECtrl.headerList.map(el => {
						if(el.type === 'kpi')
						{
							el.deltaExecFlag = false;
							el.valueCompareFromBaseFlag = null;
							el.percentageFlag = false;
							el.dayDiff = null;
							el.operationType = null;
							el.dayDiffDeltaFlag = false;
						}
						return el;
					});
					ipamODECtrl.resetODEFormDate();
				}
			}

		}
		else if(type === 'timeSelectionType')
		{
			ipamODECtrl.resetODEFormDate();
			ipamODECtrl.networkDayDiff = null;
			ipamODECtrl.customTimeRange = {
				filterType: null,
				customBucketSize: null,
				customBucketType: null
			}
			ipamODECtrl.selectiveDates = [];
			ipamODECtrl.selectiveDatesModel = "";
		}
		else if(type === 'networkelementlist') {
			ipamODECtrl.networkElementList = [];
		}

	}


	ipamODECtrl.selectiveDatesFn=function(action,date=null){
		if(action === 'Delete')
		{
			var deleteIndex = ipamODECtrl.selectiveDates.indexOf(date);
			if(deleteIndex != -1)
				ipamODECtrl.selectiveDates.splice(deleteIndex,1);
		}
		else if(action === 'ClearAll')
		{
			ipamODECtrl.selectiveDates = [];
			ipamODECtrl.selectiveDatesModel = "";
			$('#odemultidateformdivid').data("DateTimePicker").clear();
		}
		else if(action === 'convertToDateObject')
		{
			return moment(date, "YYYY-MM-DD-HH:mm:ss").toDate();
		}
	}


	ipamODECtrl.resetODEFormDate=function(){

		// clear date models
		ipamODECtrl.startTime = "";
		ipamODECtrl.endTime = "";

		// destroy the datepicker and unbind the previous dp.change event listener
		try {

			if($("#datetimepickerodestartform").data("DateTimePicker"))
			{
				$('#datetimepickerodestartform').data("DateTimePicker").clear();
				$('#datetimepickerodeendform').data("DateTimePicker").clear();

				$("#datetimepickerodestartform").unbind("dp.change");
				$("#datetimepickerodeendform").unbind("dp.change");

				$("#datetimepickerodestartform").datetimepicker("destroy");
				$("#datetimepickerodeendform").datetimepicker("destroy");
			}

			if($("#odemultidateformdivid").data("DateTimePicker"))
			{
				$('#odemultidateformdivid').data("DateTimePicker").clear();

				$("#odemultidateformdivid").unbind("dp.change");

				$("#odemultidateformdivid").datetimepicker("destroy");
			}
		} catch(e) {
			console.error(e);
		}

		// get dateType
		var dateType = ipamODECtrl.getDateType();

		//set date field pattern and error message
		ipamODECtrl.datePattern = dateType === 'Normal' ?
				/^\d\d\d\d-([0]{0,1}[1-9]|1[012])-([1-9]|([012][0-9])|(3[01]))-(20|21|22|23|[0-1]?\d):[0-5]?\d:[0-5]?\d$/ :
				/^\d\d\d\d-([0]{0,1}[1-9]|1[012])-([1-9]|([012][0-9])|(3[01]))$/;
		ipamODECtrl.datePatternErrorMsg = dateType === 'Normal' ? 'datetimepicker' : 'datepicker';

		// enable disable end date field
		ipamODECtrl.disableODEEndDate = ipamODECtrl.disableEndDate(dateType, ipamODECtrl.aggregationOperationType);

		ipamODECtrl.disableSelectiveDates = ipamODECtrl.disableSelectiveDatesFn(dateType);

		if(ipamODECtrl.timeSelectionType === 'selectiveDates' && ipamODECtrl.disableSelectiveDates){
			ipamODECtrl.timeSelectionType = "";
		}

		// set date picker and bind dp.change Listeners
		$timeout(function(){

			$('#odemultidateformdivid').datetimepicker({
				format : 'YYYY-MM-DD-00:00:00',
				maxDate: "now",
				useCurrent: false,
				keepOpen: true,
				widgetPositioning: {horizontal: 'right', vertical: 'top'}
			});

			$("#odemultidateformdivid").on( "dp.change", function(e) {

				$timeout(function(){
					$scope.$apply(function() {
						if($("#odemultidateform").val() && !ipamODECtrl.selectiveDates.includes($("#odemultidateform").val()))
						{
							ipamODECtrl.selectiveDates.push($("#odemultidateform").val());
							ipamODECtrl.selectiveDates.sort();
						}
					});
				},0);
			});


			if(dateType === 'Normal')
			{

				// start Time
				$('#datetimepickerodestartform').datetimepicker({
					format : 'YYYY-MM-DD-HH:mm:ss',
					maxDate: "now",
					useCurrent: false,
					keepOpen: false,
					widgetPositioning: {horizontal: 'right', vertical: 'top'}
				});

				$("#datetimepickerodestartform").on( "dp.change", function(e) {

					$timeout(function(){
						$scope.$apply(function() {
							ipamODECtrl.startTime = $("#odestarttimeform").val();
						});
					},0);

					// $('#datetimepickerodeendform').data("DateTimePicker").minDate(e.date);
					$('#datetimepickerodeendform').data("DateTimePicker").clear();
				});

				// end Time
				$('#datetimepickerodeendform').datetimepicker({
					format : 'YYYY-MM-DD-HH:mm:ss',
					maxDate: "now",
					useCurrent: false,
					keepOpen: false,
					widgetPositioning: { horizontal: 'right', vertical: 'top'}
				});

				$("#datetimepickerodeendform").on( "dp.change", function(e) {

					$timeout(function(){
						$scope.$apply(function() {
							ipamODECtrl.endTime = $("#odeendtimeform").val();
						});
					},0);
				});
			}
			else if(['Delta Execution','Dual Time','Busy Hour','Supporting Kpi','Calculate Aging'].includes(dateType))
			{
				// start Time
				$('#datetimepickerodestartform').datetimepicker({
					format : 'YYYY-MM-DD',
					maxDate: 'now',
					useCurrent: false,
					keepOpen: false,
					widgetPositioning: {horizontal: 'right', vertical: 'top'}
				});

				$("#datetimepickerodestartform").on( "dp.change", function(e) {

					$timeout(function(){
						$scope.$apply(function() {
							ipamODECtrl.startTime = $("#odestarttimeform").val();
						});
					},0);

					// $('#datetimepickerodeendform').data("DateTimePicker").minDate(e.date);
					$('#datetimepickerodeendform').data("DateTimePicker").clear();

					if($("#odestarttimeform").val()) {
						$('#datetimepickerodeendform').data("DateTimePicker").date(moment($("#odestarttimeform").val()).add(1,'days'));
					}
				});

				// end Time
				$('#datetimepickerodeendform').datetimepicker({
					format : 'YYYY-MM-DD',
					maxDate: moment().add(1,'days').set({'hour': 0, 'minute': 0, 'second': 0}),
					useCurrent: false,
					keepOpen: false,
					widgetPositioning: { horizontal: 'right', vertical: 'top'}
				});

				$("#datetimepickerodeendform").on( "dp.change", function(e) {

					$timeout(function(){
						$scope.$apply(function() {
							ipamODECtrl.endTime = $("#odeendtimeform").val();
						});
					},0);
				});
			}

		},300);
	}


	ipamODECtrl.getDateType=function(networkElement){

		var data = {};
		var operations = ['busyHourValue','busyHour','busyQuarter','busyQuarterValue'];

		if(networkElement)
		{
			data.reportType = networkElement.reportType; // Counter, Kpi, Mixed
			data.headerList = angular.copy(networkElement.headerList);
		}
		else
		{
			data.reportType = ipamODECtrl.reportType; // Counter, Kpi, Mixed
			data.headerList = angular.copy(ipamODECtrl.headerList);
		}

		if(!data.reportType || data.reportType === "Counter" || !data.headerList || !data.headerList.length)
		{
			return "Normal";
		}
		else if(data.headerList.some(el => el.type === 'kpi' && el.deltaExecFlag))
		{
			return "Delta Execution";
		}
		else if(data.headerList.some(el => el.type === 'kpi' && el.isNestedDual))
		{
			return "Dual Time";
		}
		else if(data.headerList.some(el => el.type === 'kpi' && (operations.includes(el.timeBasedAggregation) || operations.includes(el.hierachyBasedAggregation)) ))
		{
			return "Busy Hour";
		}
		else if(data.headerList.some(el => el.type === 'kpi' &&el.agingFlag))
		{
			return "Calculate Aging";
		}
		else if(data.headerList.some(el => el.type === 'kpi' &&el.supportingKpi))
		{
			return "Supporting Kpi";
		}
		else
		{
			return "Normal";
		}
	}


	ipamODECtrl.setODEFormDate=function(networkElement){

		// wait to avoid listener binding race with resetODEFormDate():clearodedata('form')
		$timeout(function(){
			ipamODECtrl.resetODEFormDate();
		},500);

		
		
		// wait for listener binding
		$timeout(function(){
			ipamODECtrl.startTime = ipamODECtrl.setZeroTimePart('remove',networkElement,networkElement.startTime);
			ipamODECtrl.endTime = ipamODECtrl.setZeroTimePart('remove',networkElement,networkElement.endTime);

			// set date
			try {
				if($('#datetimepickerodestartform').data("DateTimePicker"))
				{
					$('#datetimepickerodestartform').data("DateTimePicker").date(ipamODECtrl.startTime);
					$('#datetimepickerodeendform').data("DateTimePicker").date(ipamODECtrl.endTime);
				}
			} catch(e) {
				console.error(e);
			}
		}, 1500);
	}


	ipamODECtrl.disableEndDate=function(dateType, aggregationOperationType){

		if(dateType === 'Normal')
			return false;
		else if('Delta Execution' === dateType)
			return false;
		else if('Busy Hour' === dateType)
			return false;
		else if('Supporting Kpi' === dateType)
			return false;
		else if('Calculate Aging' === dateType)
			return false;
		else if('Dual Time' === dateType)
			return false;
		else
			return false;
	}


	ipamODECtrl.disableSelectiveDatesFn=function(dateType){

		if(dateType === 'Normal')
			return false;
		else if('Delta Execution' === dateType)
			return true;
		else if('Busy Hour' === dateType)
			return false;
		else if('Supporting Kpi' === dateType)
			return false;
		else if('Calculate Aging' === dateType)
			return false;
		else if('Dual Time' === dateType)
			return false;
		else
			return false;
	}


	ipamODECtrl.setZeroTimePart=function(action, networkElement, date){

		var dateType = ipamODECtrl.getDateType(networkElement);
		var outputDate = null;

		if(!date)
			return '';

		if(['Normal'].includes(dateType))
			return date;

		if(action === 'add' && 'YYYY-MM-DD'.length === date.length)
		{
			outputDate = date + '-00:00:00';
		}
		else if(action == 'remove' && 'YYYY-MM-DD-HH:mm:ss'.length === date.length)
		{
			outputDate = date.replace('-00:00:00','');
		}
		else
		{
			outputDate = date;
		}

		return outputDate;
	}


	ipamODECtrl.getODEKPIList=function(){

		if(!ipamODECtrl.nodeName)
			return;

		var queryString = "operation=getKpiListAgg";

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"nodeName": ipamODECtrl.nodeName,
			"executionType": (ipamODECtrl.executionType === 'MultipleProduct') ? 'MultiProduct' : 'SingleProduct'
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT, header, queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){

					ipamODECtrl.viewKpiList=response.AppData.appdata.resultList;

					if(ipamODECtrl.viewKpiList.length == 0){
						ATOMService.showMessage('error','WARNING','Kpi List is empty');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Kpi List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.subNeApplicableChange=function(){

		ipamODECtrl.clearODEData('subNeApplicable');
	}


	ipamODECtrl.onSubNESelected=function(){

		if(ipamODECtrl.subNe)
		{
			ipamODECtrl.getODECounterCategoryList();
		}
	}


	ipamODECtrl.getSubApplicableAndSubNeList=function(){

		if(!ipamODECtrl.nodeName)
			return;

		var queryString = "operation=getSubApplicableAndSubNeList";

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"nodeName":ipamODECtrl.nodeName
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){
					if(response.AppData.appdata.subNeApplicable && response.AppData.appdata.resultList.length)
					{
						ipamODECtrl.showSubNeApplicableFlag = response.AppData.appdata.subNeApplicable;
						ipamODECtrl.subNeList = response.AppData.appdata.resultList;
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Sub Ne Details. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','Unable to fetch Sub Ne Details. server is not reachable');
		});

	}


	ipamODECtrl.getODECounterCategoryList=function(){

		if(!ipamODECtrl.nodeName)
			return;

		var queryString = "operation=getCounterCategoryList"; 

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"nodeName":ipamODECtrl.nodeName
		};

		if(ipamODECtrl.subNe) {
			header.subNe = ipamODECtrl.subNe;
		}

		ATOMCommonServices.getMethodForVProbe(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){
					ipamODECtrl.viewCounterCategoryList = response.AppData.appdata.resultList;
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Category List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

		//ipamODECtrl.fetchFiledNameList();

	}


	ipamODECtrl.getODECounterNamesList=function(){

		ipamODECtrl.nh.nhApplicable = false;
		ipamODECtrl.nh.showNHApplicable = false;
		ipamODECtrl.nh.nhTotalCount = 1;
		ipamODECtrl.nh.nhLabel = {};

		ipamODECtrl.resetODENHData();

		if(!ipamODECtrl.nodeName || !ipamODECtrl.categoryName)
			return;

		var queryString="operation=getCounterNameListAgg";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"nodeName": ipamODECtrl.nodeName,
			"category": ipamODECtrl.categoryName
		};

		ATOMCommonServices.getMethodForVProbe(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){

					ipamODECtrl.viewCounterNameList = response.AppData.appdata.resultList;

					if(ipamODECtrl.viewCounterNameList.length > 0) {

						if(response.AppData.appdata.hasOwnProperty('nhApplicable') && response.AppData.appdata.hasOwnProperty('nhTotalCount') && response.AppData.appdata.hasOwnProperty('nhTotalCount') > 0) {
							ipamODECtrl.nh.nhApplicable = false;
							ipamODECtrl.nh.showNHApplicable = response.AppData.appdata.nhApplicable;
							ipamODECtrl.nh.nhTotalCount = response.AppData.appdata.nhTotalCount;
							ipamODECtrl.nh.nhLabel = response.AppData.appdata.nhLabel;
							ipamODECtrl.nh.particularNHLevelObjList = Object.keys(ipamODECtrl.nh.nhLabel).map(level=>{
								return {level: level, name: ipamODECtrl.nh.nhLabel[level]};
							});
						}
						else {
							ipamODECtrl.nh.nhApplicable = false;
							ipamODECtrl.nh.showNHApplicable = false;
						}
					}
					else {
						ATOMService.showMessage('error','WARNING','Counter List is empty. ');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Counter List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.odeNHApplicableChange=function(){

		ipamODECtrl.nh.isParticularNH = null;
		ipamODECtrl.resetODENHData();
	}


	ipamODECtrl.isParticularNHChange=function(isParticular){

		ipamODECtrl.resetODENHData();

		if(isParticular) {
		}
		else {
			ipamODECtrl.fetchODENHValueList(1);
		}
	}


	ipamODECtrl.resetODENHData=function(){

		ipamODECtrl.nh.networkHierarchy = {};
		ipamODECtrl.nh.arrData = [];
		ipamODECtrl.nh.currentNHLevel = 1;

		ipamODECtrl.nh.particularNHLevelObj = null;
		ipamODECtrl.nh.particularNHValueList = [];
		ipamODECtrl.nh.particularNHValue = "";
	}


	ipamODECtrl.fetchSubExpressionParticularNHData=function(){

		if(!ipamODECtrl.nodeName || !ipamODECtrl.categoryName || !ipamODECtrl.nh.particularNHLevelObj.level)
			return;

		var nhFetchJson = {
			nodeName: ipamODECtrl.nodeName,
			category: ipamODECtrl.categoryName,
			nhType: ipamODECtrl.nh.particularNHLevelObj.level
		};

		var queryString = "operation=getNetworkHierarchy";

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"nodeName":ipamODECtrl.nodeName,
			"category":ipamODECtrl.categoryName
		};

		ATOMCommonServices.commonPostMethod(nhFetchJson,Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.nh.particularNHValueList = response.AppData.appdata.resultList;

					if(response.AppData.appdata.resultList === 0)
					{
						ATOMService.showMessage('error','WARNING','Value List is empty. ');
					}
				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch Network Hierarchy Value List. Please contact admin. ');
				}

			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.setODENHData=function(changedNHLevel){

		var loopTill = ipamODECtrl.nh.currentNHLevel;

		// changedNHLevel applicable only in case of drop down value changed from ui: it helps to remove all the following drop downs and add buttons
		if(changedNHLevel) {
			loopTill = changedNHLevel + 1 ;
			ipamODECtrl.nh.currentNHLevel = changedNHLevel;
		}

		var nhData = {};
		var arrData = [];

		for(var i = 1; i < loopTill; i++)
		{
			nhData['nh' + i] = ipamODECtrl.nh.networkHierarchy['nh' + i];
			arrData[i-1] = ipamODECtrl.nh.arrData[i-1];
		}

		ipamODECtrl.nh.networkHierarchy = nhData;
		ipamODECtrl.nh.arrData = arrData;

	}


	ipamODECtrl.fetchODENHValueList=function(forIndex){

		ipamODECtrl.nh.currentNHLevel = forIndex;
		ipamODECtrl.setODENHData();
		ipamODECtrl.getODENetworkHierarchy();
	}


	ipamODECtrl.getODENetworkHierarchy=function(){

		var nhFetchJson = {
			nodeName: ipamODECtrl.nodeName,
			category: ipamODECtrl.categoryName,
			nhType: 'nh' + ipamODECtrl.nh.currentNHLevel,
			networkHierarchy: angular.copy(ipamODECtrl.nh.networkHierarchy)
		};

		var queryString = "operation=getNetworkHierarchy";

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"nodeName":ipamODECtrl.nodeName,
			"category":ipamODECtrl.categoryName
		};

		ATOMCommonServices.commonPostMethod(nhFetchJson,Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.nh.arrData[ipamODECtrl.nh.currentNHLevel-1] = response.AppData.appdata.resultList;

					if(response.AppData.appdata.resultList === 0)
					{
						ATOMService.showMessage('error','WARNING','Value List is empty. ');
					}
				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch Network Hierarchy List. Please contact admin. ');
				}

			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.addODESpecificCounters=function() {

		if(!ipamODECtrl.categoryName || !ipamODECtrl.viewCounterNameList.length)
			return;
//		
//		if(ipamODECtrl.viewCounterNameList.length>100){
//			ATOMService.showMessage('error','WARNING','Header size cannot be greater than 100.Please use Selected Counters. ');
//            return;
//		}

		ipamODECtrl.prepareODECounterData();

		var category = ipamODECtrl.nh.finalCounterData.fullCounterName.slice(0,-1);

		if(!ipamODECtrl.categoryNameList.includes(category))
		{
			ipamODECtrl.categoryNameList.push(category);
		}

		var finalCounterData = ipamODECtrl.nh.finalCounterData;

		for(var i = 0; i < ipamODECtrl.viewCounterNameList.length; i++) {

			var nhCounterData = angular.copy(finalCounterData);

			nhCounterData.fullCounterName += ipamODECtrl.viewCounterNameList[i].counterName;

			if(ipamODECtrl.headerList.find(el => el.fullCounterName === nhCounterData.fullCounterName))
				continue;

			var counterData = {
				nodeName: ipamODECtrl.nodeName,
				sumRequired: true,
				counterRequired: false,
				name: nhCounterData.fullCounterName,
				counterCategory: ipamODECtrl.categoryName,
				counterName: ipamODECtrl.viewCounterNameList[i].counterName,
				timeBasedAggregation:
					(!ipamODECtrl.viewCounterNameList[i].timeBasedAggregation || ipamODECtrl.viewCounterNameList[i].timeBasedAggregation === "null") ?
							"sum" : ipamODECtrl.viewCounterNameList[i].timeBasedAggregation,
				hierachyBasedAggregation: (!ipamODECtrl.viewCounterNameList[i].hierachyBasedAggregation || ipamODECtrl.viewCounterNameList[i].hierachyBasedAggregation === "null") ?
						"sum" : ipamODECtrl.viewCounterNameList[i].hierachyBasedAggregation,
				headerName: nhCounterData.fullCounterName,
				type: 'counter',
				subNeApplicable: ipamODECtrl.subNeApplicable
			};

			if(ipamODECtrl.subNeApplicable) {
				counterData.subNe = ipamODECtrl.subNe;
			}

			// merge nh data and counterData
			var counter = angular.merge(nhCounterData, counterData);

			ipamODECtrl.headerList.push(counter);
		}

		ipamODECtrl.categoryName = "";
		ipamODECtrl.viewCounterNameList = [];

		ipamODECtrl.nh = {};
	}


	ipamODECtrl.addODESelectedCounters=function() {

		if(!ipamODECtrl.counterNameList || ipamODECtrl.counterNameList.length==0)
			return;

		ipamODECtrl.prepareODECounterData();

		var finalCounterData = ipamODECtrl.nh.finalCounterData;

		for(var i = 0; i < ipamODECtrl.counterNameList.length; i++) {

			var nhCounterData = angular.copy(finalCounterData);

			nhCounterData.fullCounterName += ipamODECtrl.counterNameList[i].counterName;

			if(ipamODECtrl.headerList.find(el => el.fullCounterName === nhCounterData.fullCounterName))
				continue;

			var counterData = {
				nodeName: ipamODECtrl.nodeName,
				sumRequired: true,
				counterRequired: false,
				name: nhCounterData.fullCounterName,
				counterCategory: ipamODECtrl.categoryName,
				counterName: ipamODECtrl.counterNameList[i].counterName,
				timeBasedAggregation:
					(!ipamODECtrl.counterNameList[i].timeBasedAggregation || ipamODECtrl.counterNameList[i].timeBasedAggregation === "null") ?
							"sum" : ipamODECtrl.counterNameList[i].timeBasedAggregation,
				hierachyBasedAggregation: (!ipamODECtrl.counterNameList[i].hierachyBasedAggregation || ipamODECtrl.counterNameList[i].hierachyBasedAggregation === "null") ?
						"sum" : ipamODECtrl.counterNameList[i].hierachyBasedAggregation,
				headerName: nhCounterData.fullCounterName,
				type: 'counter',
				subNeApplicable: ipamODECtrl.subNeApplicable
			};

			if(ipamODECtrl.subNeApplicable) {
				counterData.subNe = ipamODECtrl.subNe;
			}

			// merge nh data and counterData
			var counter = angular.merge(nhCounterData, counterData);

			ipamODECtrl.headerList.push(counter);
			
//			if(ipamODECtrl.huObj.reportType==="Mixed"){
//				if(ipamODECtrl.headerList.length < 50){
//					ipamODECtrl.headerList.push(counter);
//				}else{
//					ATOMService.showMessage('error','WARNING','HeaderList cannot be greater than 50. ');
//		
//				}
//			}else {
//				if(ipamODECtrl.headerList.length < 100 ){
//					ipamODECtrl.headerList.push(counter);
//				}else{
//					ATOMService.showMessage('error','WARNING','HeaderList cannot be greater than 100. ');
//			
//				}
//			}
		}

		ipamODECtrl.categoryName = "";
		ipamODECtrl.counterNameList = [];
		ipamODECtrl.viewCounterNameList = [];

		ipamODECtrl.nh = {};
	}


	ipamODECtrl.prepareODECounterData=function(){

		var networkHierarchy = {};
		var arrData = [];
		var count = 0;
		var fullCounterName = ipamODECtrl.categoryName + ':';

		if(ipamODECtrl.nh.nhApplicable && ipamODECtrl.nh.isParticularNH === false) {

			// validate and prepare category counter data

			for(var i = 1; i <= Math.min(ipamODECtrl.nh.nhTotalCount, ipamODECtrl.nh.currentNHLevel) ; i++)
			{
				if(ipamODECtrl.nh.networkHierarchy.hasOwnProperty('nh' + i) && ipamODECtrl.nh.networkHierarchy['nh'+i])
				{
					fullCounterName += ipamODECtrl.nh.networkHierarchy['nh'+i] + ':';
					networkHierarchy['nh'+i] = ipamODECtrl.nh.networkHierarchy['nh'+i];
					arrData[i-1] = ipamODECtrl.nh.arrData[i-1];
					count++;
				}
				else {
					break;
				}
			}

		}

		if(ipamODECtrl.nh.nhApplicable && ipamODECtrl.nh.isParticularNH === true
				&& ipamODECtrl.nh.particularNHLevelObj && ipamODECtrl.nh.particularNHValue)
		{
			networkHierarchy = {};
			networkHierarchy[ipamODECtrl.nh.particularNHLevelObj.level] = ipamODECtrl.nh.particularNHValue;

			fullCounterName += ipamODECtrl.nh.particularNHValue + ":";
			ipamODECtrl.nh.fullCounterName = fullCounterName;
		}
		else if(ipamODECtrl.nh.nhApplicable && ipamODECtrl.nh.isParticularNH === false && count >= 1)
		{
			ipamODECtrl.nh.networkHierarchy = networkHierarchy;
			ipamODECtrl.nh.arrData = arrData;
			ipamODECtrl.nh.currentNHLevel = count;

			ipamODECtrl.nh.fullCounterName = fullCounterName;
		}
		else {
			ipamODECtrl.nh.nhApplicable = false;
			ipamODECtrl.resetODENHData();
			ipamODECtrl.nh.fullCounterName = ipamODECtrl.categoryName + ':';
		}

		var finalCounterData = {
			fullCounterName: ipamODECtrl.nh.fullCounterName,
			nhApplicable: ipamODECtrl.nh.nhApplicable
		}

		if(ipamODECtrl.nh.nhApplicable && ipamODECtrl.nh.isParticularNH === false) {
			finalCounterData.networkHierarchy = ipamODECtrl.nh.networkHierarchy;
			finalCounterData.nhCount = ipamODECtrl.nh.currentNHLevel;
		}
		else if(ipamODECtrl.nh.nhApplicable && ipamODECtrl.nh.isParticularNH === true)
		{
			finalCounterData.networkHierarchy = networkHierarchy;
		}

		ipamODECtrl.nh.finalCounterData = finalCounterData;
	}


	ipamODECtrl.addODEKpiFn=function(action){

		if(action === 'add') {

			if(!ipamODECtrl.kpiObject || !ipamODECtrl.kpiHeader)
				return;

			var kpiObject = ipamODECtrl.kpiObject;

			if(ipamODECtrl.headerList.find(el=> el.type === 'kpi' && el.name === kpiObject.kpiName))
			{
				ATOMService.showMessage('error','WARNING','KPI already added. ');
				return;
			}

			if(ipamODECtrl.headerList.find(el=> el.headerName === ipamODECtrl.kpiHeader))
			{
				ATOMService.showMessage('error','WARNING','Header name already added. ');
				return;
			}

			var kpi = {
				nodeName: ipamODECtrl.nodeName,
				sumRequired: true,
				counterRequired: false,
				name: kpiObject.kpiName,
				headerName: ipamODECtrl.kpiHeader,
				type: 'kpi',
				timeBasedAggregation: (!kpiObject.timeBasedAggregation || kpiObject.timeBasedAggregation === "null") ? "sum" : kpiObject.timeBasedAggregation,
				hierachyBasedAggregation: (!kpiObject.hierachyBasedAggregation || kpiObject.hierachyBasedAggregation === "null") ? "sum" : kpiObject.hierachyBasedAggregation,

				supportingKpi: kpiObject.supportingKpi,

				isNestedNhPresentFlag: !!kpiObject.isNestedNhPresentFlag,
				isNhPresentFlag: !!kpiObject.isNhPresentFlag,
				isDefaultValueFlag: (kpiObject.isDefaultValueFlag !== false),

				consecutiveFlag: !!kpiObject.consecutiveFlag,
				interval: kpiObject.interval,
				nestedConsecutiveFlag: !!kpiObject.nestedConsecutiveFlag,
				nestedConsecutiveInterval: kpiObject.nestedConsecutiveInterval,

				modeFlag: !!kpiObject.modeFlag,

				deltaExecFlag: false,
				valueCompareFromBaseFlag: null,
				percentageFlag: false,
				dayDiff: null,
				dayDiffDeltaFlag: false,
				operationType: null,

				isNestedDual: !!kpiObject.isNested,
				agingFlag: !!kpiObject.agingFlag,
				agingPeriod: kpiObject.agingPeriod,

				isTimeShift: !!kpiObject.isTimeShift,
				nestedTimeShiftFlag: !!kpiObject.nestedTimeShiftFlag,

				isNotMissing: !!kpiObject.isNotMissing
			}

			if(kpiObject.busyHourDependentOperation)
			{
				kpi.busyHourDependentOperation = kpiObject.busyHourDependentOperation;

			}
			ipamODECtrl.headerList.push(kpi);
//			if(ipamODECtrl.headerList.length<50){
//				ipamODECtrl.headerList.push(kpi);
//			}else{
//				ATOMService.showMessage('error','WARNING','HeaderList cannot have more than 50 KPIs ');
//				return;
//			}

			ipamODECtrl.kpiObject = null;
			ipamODECtrl.kpiHeader = null;

			ipamODECtrl.resetODEFormDate();
		}
		else if('kpiSelectionChange') {

			if(!ipamODECtrl.kpiObject)
				 ipamODECtrl.kpiHeader = null;
			else
				ipamODECtrl.kpiHeader = ipamODECtrl.kpiObject.kpiName;
		}
	}


	ipamODECtrl.changeDeltaExecFlag=function(type, data){

		if(type === 'single')
		{
			var kpi = ipamODECtrl.headerList.find(el => el === data);
			if(kpi.deltaExecFlag === false)
			{
				kpi.valueCompareFromBaseFlag = null;
				kpi.percentageFlag = false;
				kpi.dayDiff = null;
				kpi.dayDiffDeltaFlag = false;
				kpi.operationType = null;
			}
			else
			{
				kpi.counterRequired = false;
				// open edit kpi modal
				ipamODECtrl.editKPIRow('openModal',data);
			}
		}

		ipamODECtrl.resetODEFormDate();
	}





	ipamODECtrl.viewCounterRow=function(action, data){

		if(action === 'openModal')
		{
			var counter = ipamODECtrl.headerList.find(el => el === data);
			var counterIndex = ipamODECtrl.headerList.findIndex(el => el === data);

			ipamODECtrl.counterRowObj = {};
			ipamODECtrl.counterRowObj.counter = angular.copy(counter);
			ipamODECtrl.counterRowObj.index = counterIndex;
			angular.element('#modalForCounterRow').modal('show');
		}
		else if(action === 'update')
		{
			var counter = ipamODECtrl.counterRowObj.counter;

			if($scope.counterrowform.$invalid)
			{
				ATOMService.showMessage('error','WARNING','Please enter valid counter details. ');
				return;
			}

			if(counter.headerName && !counter.headerName.trim())
			{
				ATOMService.showMessage('error','WARNING','Please enter valid counter details. ');
				return;
			}

			if(ipamODECtrl.headerList.find(el=> el.name != counter.name && el.headerName === counter.headerName))
			{
				ATOMService.showMessage('error','WARNING','Header name already added. ');
				return;
			}

			counter.headerName = counter.headerName.trim();

			ipamODECtrl.headerList[ipamODECtrl.counterRowObj.index] = angular.copy(counter);
			angular.element('#modalForCounterRow').modal('hide');
		}
	}

	ipamODECtrl.editKPIRow=function(action, data){

		if(action === 'openModal')
		{
			var kpi = ipamODECtrl.headerList.find(el => el === data);
			var kpiIndex = ipamODECtrl.headerList.findIndex(el => el === data);

			ipamODECtrl.kpiRowObj = {};
			ipamODECtrl.kpiRowObj.kpi = angular.copy(kpi);
			ipamODECtrl.kpiRowObj.index = kpiIndex;
			angular.element('#modalForKpiRow').modal('show');
		}
		else if(action === 'deltaExecFlagChange')
		{
			var kpi = ipamODECtrl.kpiRowObj.kpi;
			if(kpi.deltaExecFlag === false)
			{
				kpi.valueCompareFromBaseFlag = null;
				kpi.percentageFlag = false;
				kpi.dayDiff = null;
				kpi.dayDiffDeltaFlag = false;
				kpi.operationType = null;
			}
			else
			{
				kpi.counterRequired = false;

			}
		}
		else if(action === 'valueCompareFromBaseFlagChange')
		{
			var kpi = ipamODECtrl.kpiRowObj.kpi;
			kpi.percentageFlag = false;
			kpi.dayDiffDeltaFlag = false;
		}
		else if(action === 'update')
		{
			var kpi = ipamODECtrl.kpiRowObj.kpi;

			if($scope.kpirowform.$invalid)
			{
				ATOMService.showMessage('error','WARNING','Please enter valid KPI data. ');
				return;
			}

			if(ipamODECtrl.headerList.find(el=> el.name != kpi.name && el.headerName === kpi.headerName))
			{
				ATOMService.showMessage('error','WARNING','Header name already added. ');
				return;
			}

			ipamODECtrl.headerList[ipamODECtrl.kpiRowObj.index] = angular.copy(kpi);
			ipamODECtrl.resetODEFormDate();
			angular.element('#modalForKpiRow').modal('hide');
		}
	}


	ipamODECtrl.headerFilterFn=function(action, data, index){

		ipamODECtrl.headerFilterOperationList = ['equals','notEquals','greaterThanEquals','greaterThan','lessThanEquals','lessThan','between'];

		if(action === 'radioChange')
		{
			if(ipamODECtrl.headerPosition != 'column')
				return;

			ipamODECtrl.headerFilterList = [];

			if(ipamODECtrl.headerFilterFlag)
			{

				ipamODECtrl.headerFilterFn('emptyFilterObj');

				ipamODECtrl.headerNameList = ipamODECtrl.headerList.map(el=> el.name);
				angular.element('#modalForHeaderFilter').modal('show');
			}

		}
		else if(action === 'emptyFilterObj')
		{
			ipamODECtrl.editFilterIndex = -1;

			ipamODECtrl.headerFilterObject = {headerName:"", operation:"", value: null,minValue: null,maxValue: null, removeEmptyHeaderFlag: false};

			if($scope.odeheaderfilterform) {
				$scope.odeheaderfilterform.$setUntouched();
				$scope.odeheaderfilterform.$setPristine();
			}
		}
		else if(action === 'addFilter')
		{

			if(ipamODECtrl.editFilterIndex === -1)
			{
				
				
				if(ipamODECtrl.headerFilterList.length === 10)
				{
					ATOMService.showMessage('error','ERROR','Maximum 10 filters are allowed. ');
					return;
				}
				else if(ipamODECtrl.headerFilterList.find(el=> el.headerName === ipamODECtrl.headerFilterObject.headerName))
				{
					ATOMService.showMessage('error','ERROR','Filter with same header name already exists. ');
					return;
				}
				
				if(ipamODECtrl.headerFilterObject.maxValue < ipamODECtrl.headerFilterObject.minValue)
				{
					ATOMService.showMessage('error','ERROR','Min Value should be Less than Max Value. ');
					return;
				}
			}
			else if(ipamODECtrl.editFilterIndex != -1)
			{
				if(ipamODECtrl.headerFilterList.find((el,i)=>
					el.headerName === ipamODECtrl.headerFilterObject.headerName && i != ipamODECtrl.editFilterIndex))
				{
					ATOMService.showMessage('error','ERROR','Filter with same header name already exists. ');
					return;
				}
				
				if(ipamODECtrl.headerFilterObject.maxValue < ipamODECtrl.headerFilterObject.minValue)
				{
					ATOMService.showMessage('error','ERROR','Min Value should be Less than Max Value. ');
					return;
				}
			}

			// add/update filter
			if(ipamODECtrl.editFilterIndex != -1)
				ipamODECtrl.headerFilterList[ipamODECtrl.editFilterIndex] = angular.copy(ipamODECtrl.headerFilterObject);
			else
				ipamODECtrl.headerFilterList.push(angular.copy(ipamODECtrl.headerFilterObject));

			ipamODECtrl.headerFilterFn('emptyFilterObj');
		}
		else if(action === 'editFilter')
		{
			ipamODECtrl.editFilterIndex = index;
			ipamODECtrl.headerFilterObject = angular.copy(ipamODECtrl.headerFilterList[index]);
		}
		else if(action === 'deleteFilter')
		{
			if(index === ipamODECtrl.editFilterIndex)
			{
				ATOMService.showMessage('error','WARNING','Please complete Edit operation first. ');
				return;
			}
			ipamODECtrl.headerFilterList.splice(index,1);
		}
		else if(action === 'deleteDueToCounterKpiDelete')
		{
			if(!data)
				return;

			var deleteIndex = ipamODECtrl.headerFilterList.findIndex(el=> el.headerName === data);

			if(deleteIndex >= 0)
				ipamODECtrl.headerFilterList.splice(deleteIndex,1);
		}
		else if(action === 'openModal')
		{
			ipamODECtrl.headerFilterFn('emptyFilterObj');

			ipamODECtrl.headerNameList = ipamODECtrl.headerList.map(el=> el.name);

			angular.element('#modalForHeaderFilter').modal('show');
		}
		else if(action === 'resetData')
		{
			ipamODECtrl.headerFilterFn('emptyFilterObj');
			ipamODECtrl.headerFilterList = [];
		}
		else if(action === 'apply')
		{
			if(!ipamODECtrl.headerFilterList.length)
			{
				ATOMService.showMessage('error','ERROR','Please add minimum one filter. ');
				return;
			}
			angular.element('#modalForHeaderFilter').modal('hide');
		}else if(action === 'changeOperation')
		{
			ipamODECtrl.headerFilterObject.maxValue=null;
ipamODECtrl.headerFilterObject.minValue=null;
ipamODECtrl.headerFilterObject.value=null;
		}
	}


	ipamODECtrl.addODEAggregation=function(){

		if(!ipamODECtrl.fieldName || (!ipamODECtrl.size && ipamODECtrl.size !== 0))
			return;

		if(ipamODECtrl.aggregationList.length === 7)
		{
			ATOMService.showMessage('error','WARNING','Maximum 7 Aggregation Levels are allowed. ');
			return;
		}

		var existingAggIndex = ipamODECtrl.aggregationList.findIndex(el=> el.fieldName === ipamODECtrl.fieldName);

		if(existingAggIndex >= 0){
			ATOMService.showMessage('error','WARNING','Field already added in Aggregation. ');
			return;
		}

		var existingAttrIndex = ipamODECtrl.attributes.findIndex(el=> el.fieldName === ipamODECtrl.fieldName);
		if(existingAttrIndex != -1){
			ipamODECtrl.attributes.splice(existingAttrIndex,1);
		}

		var aggr = {
			fieldName: ipamODECtrl.fieldName,
			category: ipamODECtrl.rawCategory ? ipamODECtrl.rawCategory : "",
			size: ipamODECtrl.size,
			level: ipamODECtrl.aggregationList.length + 1,
			specific: false,
			specificList: [],
			manualSpecificList: []
		};

		if(ipamODECtrl.executionType === 'SingleProduct' && ipamODECtrl.aggregationOn != 'HNA')
		{
			aggr.nodeName = ipamODECtrl.nodeName;
		}

		ipamODECtrl.aggregationList.push(aggr);
		ipamODECtrl.transposeFn('fillFieldNameList');
		ipamODECtrl.summaryFn('fillFieldNameList');
		ipamODECtrl.fieldName = "";
		ipamODECtrl.size = "";
	}


	ipamODECtrl.transposeFn=function(action, data=null){
		if(action === 'transposeFlagChange')
		{
			ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};
			ipamODECtrl.transposeFn('fillFieldNameList');
		}
		else if(action === 'fillFieldNameList')
		{
			ipamODECtrl.transposeFieldNameList = [];
			if(ipamODECtrl.aggregationList)
			{
				ipamODECtrl.transposeFieldNameList = ipamODECtrl.aggregationList.map(el => el.fieldName);
			}
		}
	}


	ipamODECtrl.summaryFn=function(action, data=null){
		if(action === 'summaryFlagChange')
		{
			ipamODECtrl.summaryJSON = { "fieldName":null, "fieldPosition": null};
			ipamODECtrl.summaryFn('fillFieldNameList');
		}
		else if(action === 'fillFieldNameList')
		{
			ipamODECtrl.summaryFieldNameList = [];
			if(ipamODECtrl.aggregationList)
			{
				ipamODECtrl.summaryFieldNameList = ipamODECtrl.aggregationList.map(el => el.fieldName);
			}
		}
	}


	ipamODECtrl.deleteRowODE=function(type,data) {

		var elementIndexInArr = -1;

		if(type === 'header')
		{
			elementIndexInArr = ipamODECtrl.headerList.findIndex(el => el.name === data.name);

			ipamODECtrl.headerList.splice(elementIndexInArr,1);

			ipamODECtrl.headerFilterFn('deleteDueToCounterKpiDelete', data.name);

			ipamODECtrl.resetODEFormDate();
		}
		else if(type === 'aggregation'){

			elementIndexInArr = ipamODECtrl.aggregationList.findIndex(el => el === data);

			ipamODECtrl.aggregationList.splice(elementIndexInArr,1);

			var aggrLevel = 1;
			ipamODECtrl.aggregationList.map(el => { el.level = aggrLevel++; return el; });
			if(!ipamODECtrl.aggregationList.length)
			{
				ipamODECtrl.transposeFlag = false;
				ipamODECtrl.transposeJSON = { "fieldName":null, "fieldPosition": null};

				ipamODECtrl.summaryFlag = false;
				ipamODECtrl.summaryJSON = { "fieldName":null, "fieldPosition": null};
			}
			ipamODECtrl.transposeFn('fillFieldNameList');
			ipamODECtrl.summaryFn('fillFieldNameList');
		}
		else if(type === 'attributes'){

			elementIndexInArr = ipamODECtrl.attributes.findIndex(el => el === data);

			ipamODECtrl.attributes.splice(elementIndexInArr,1);
		}
		else if(type === 'networkElement') {

			if($rootScope.streamingFlag) {
				ATOMService.showMessage('error','WARNING','You have to stop live stream in order to perform the action. ');
				return;
			}

			elementIndexInArr = ipamODECtrl.networkElementList.findIndex(el => el === data);

			if(ipamODECtrl.neEditIndex === elementIndexInArr)
			{
				ATOMService.showMessage('error','WARNING','Please complete Edit operation first. ');
				return;
			}

			ipamODECtrl.networkElementList.splice(elementIndexInArr,1);

			if(!ipamODECtrl.networkElementList.length && ipamODECtrl.finalData && ipamODECtrl.finalData.length)
			{
				// clear execution results
				ipamODECtrl.clearODEExecutionResult();
			}
		}
	}


	ipamODECtrl.schChangeForODE=function(){

		ipamODECtrl.clearODEData('SCH');
		ipamODECtrl.fetchODEFiledNameList();
	}


	ipamODECtrl.fetchODEFiledNameList=function(){

		ipamODECtrl.fieldNameList = [];

		if((ipamODECtrl.aggregationOn != 'HNA' && !ipamODECtrl.nodeName) || !ipamODECtrl.aggregationOn)
			return;

		var queryString = "operation=getAggregationFieldNameList";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"aggregationOn": ipamODECtrl.aggregationOn
		};

		if(ipamODECtrl.aggregationOn != 'HNA')
		{
			header.nodeName = ipamODECtrl.nodeName;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(

			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.fieldNameList = response.AppData.appdata.resultList;

					if(!ipamODECtrl.fieldNameList || ipamODECtrl.fieldNameList.length === 0)
					{
						ATOMService.showMessage('error','WARNING','Field Name List is Empty. ');
					}
				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch Field Name List. Please contact admin. ');
				}
			},
			function errorCallback(responseData) {
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

	}


	ipamODECtrl.attributesFlagChangeForODE=function(){

		ipamODECtrl.hideEmptyAttribute = false;

		if(ipamODECtrl.attributesFlag) {
			ipamODECtrl.viewAttributesList = [];
			ipamODECtrl.attributeFieldName = null;
			ipamODECtrl.attributeHeaderName = null;
			ipamODECtrl.selectedAttributeValues = [];
			ipamODECtrl.attributeValueList = [];
			ipamODECtrl.attributes = [];
			ipamODECtrl.fetchODEAttributesList();
		} else {
			ipamODECtrl.viewAttributesList = [];
			ipamODECtrl.attributeFieldName = null;
			ipamODECtrl.attributeHeaderName = null;
			ipamODECtrl.selectedAttributeValues = [];
			ipamODECtrl.attributeValueList = [];
			ipamODECtrl.attributes = [];
		}
	}


	ipamODECtrl.fetchODEAttributesList=function(){

		ipamODECtrl.viewAttributesList = [];

		if(ipamODECtrl.executionType != 'SingleProduct' || !ipamODECtrl.nodeName)
			return;

		var queryString = "operation=getAggregationFieldNameList";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"aggregationOn": "RAW",
			"nodeName": ipamODECtrl.nodeName
		};


		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(

			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.viewAttributesList = response.AppData.appdata.resultList;

					if(!ipamODECtrl.viewAttributesList || ipamODECtrl.viewAttributesList.length === 0)
					{
						ATOMService.showMessage('error','WARNING','Attributes List is Empty. ');
					}
				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch Attributes List. Please contact admin. ');
				}
			},
			function errorCallback(responseData) {
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

	}

	ipamODECtrl.attributeFieldNameChange=function(){

		if(ipamODECtrl.attributeFieldName)
		{
			ipamODECtrl.attributeHeaderName = ipamODECtrl.attributeFieldName;
			ipamODECtrl.selectedAttributeValues = [];
			ipamODECtrl.attributeValueList = [];
			ipamODECtrl.fetchAttributeValueList();
		}
		else
		{
			ipamODECtrl.attributeHeaderName = null;
			ipamODECtrl.selectedAttributeValues = [];
			ipamODECtrl.attributeValueList = [];
		}
	}

	ipamODECtrl.addODEAttributes=function(){

		if(!ipamODECtrl.attributeFieldName || !ipamODECtrl.attributeHeaderName)
		{
			ATOMService.showMessage('error','WARNING','Please enter valid data. ');
			return;
		}

		if(ipamODECtrl.attributes.find(el=> el.fieldName === ipamODECtrl.attributeFieldName))
		{
			ATOMService.showMessage('error','WARNING','Attribute already exists. ');
			return;
		}

		if(ipamODECtrl.aggregationList.find(el=> el.fieldName === ipamODECtrl.attributeFieldName))
		{
			ATOMService.showMessage('error','WARNING','Attribute already exists via aggregation details. ');
			return;
		}

		ipamODECtrl.attributes.push(
				{
					'fieldName':ipamODECtrl.attributeFieldName,
					'headerName':ipamODECtrl.attributeHeaderName,
					'values': ipamODECtrl.selectedAttributeValues ? ipamODECtrl.selectedAttributeValues : [],
					'attributeValueList': ipamODECtrl.attributeValueList ? ipamODECtrl.attributeValueList : [],
				}
		);

		ipamODECtrl.attributeFieldName = null;
		ipamODECtrl.attributeHeaderName = null;
		ipamODECtrl.selectedAttributeValues = [];
		ipamODECtrl.attributeValueList = [];
	}


	ipamODECtrl.fetchAttributeValueList=function(){

		if(!ipamODECtrl.attributeFieldName)
			return;

		var queryString = "operation=getAggregationFieldValueList";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"fieldName": ipamODECtrl.attributeFieldName
		};

		header.aggregationOn = ipamODECtrl.aggregationOn;

		if(ipamODECtrl.aggregationOn != 'HNA')
		{
			header.nodeName = ipamODECtrl.nodeName;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.attributeValueList = response.AppData.appdata.resultList;
					
					if(!ipamODECtrl.attributeValueList || !ipamODECtrl.attributeValueList.length) {
						ATOMService.showMessage('error','WARNING','Specific Value List is empty');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Specific Value List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.attributeFn=function(action, data){

		if(action === 'openModal')
		{

			ipamODECtrl.attributeObj = angular.copy(data);

			if(!data.attributeValueList || !data.attributeValueList.length)
			{
				data.attributeValueList = [];
				ipamODECtrl.attributeObj.attributeValueList = [];
				ipamODECtrl.fillAttributeValueList(ipamODECtrl.attributeObj, data);
			}

			var values = angular.copy(ipamODECtrl.attributeObj.values);

			$timeout(function(){
				ipamODECtrl.attributeObj.values = values;
			}, 500);

			angular.element('#modalForAttributeValue').modal('show');
		}
		else if(action === 'update')
		{
			if(!ipamODECtrl.attributeObj.values)
				ipamODECtrl.attributeObj.values = [];

			if(!ipamODECtrl.attributeObj.attributeValueList)
				ipamODECtrl.attributeObj.attributeValueList = [];

			var position = ipamODECtrl.attributes.findIndex(el => el.fieldName === ipamODECtrl.attributeObj.fieldName)
			ipamODECtrl.attributes[position] = angular.copy(ipamODECtrl.attributeObj);

			angular.element('#modalForAttributeValue').modal('hide');
		}
	}



	ipamODECtrl.fillAttributeValueList=function(attrObj, data){

		var queryString = "operation=getAggregationFieldValueList";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"fieldName": attrObj.fieldName
		};

		header.aggregationOn = ipamODECtrl.aggregationOn;

		if(ipamODECtrl.aggregationOn != 'HNA')
		{
			header.nodeName = ipamODECtrl.nodeName;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					attrObj.attributeValueList = response.AppData.appdata.resultList;

					data.attributeValueList = response.AppData.appdata.resultList;

					if(!attrObj.attributeValueList || !attrObj.attributeValueList.length) {
						ATOMService.showMessage('error','WARNING','Specific Value List is empty');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Specific Value List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.categoryFlagChange=function(){

		ipamODECtrl.fieldName = null;
		ipamODECtrl.fieldNameList = [];
		ipamODECtrl.rawCategoryViewList = [];
		ipamODECtrl.rawCategory = "";

		if(ipamODECtrl.isCategorySpecific === 'false')
		{
			ipamODECtrl.fetchODEFiledNameList();
		}
		else
		{
			ipamODECtrl.fetchCategoryListForRawData();
		}
	}


	ipamODECtrl.fetchCategoryListForRawData=function(){

		if(!ipamODECtrl.nodeName)
			return;

		var queryString="operation=getCounterCategoryList";

		var header= {
			"username":$rootScope.globals.currentUser.username,
			"nodeName": ipamODECtrl.nodeName
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT, header, queryString).then(
			function successCallback(response) {
				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.rawCategoryViewList = response.AppData.appdata.resultList;
					if(ipamODECtrl.rawCategoryViewList.length === 0) {
						ATOMService.showMessage('error','WARNING','Category List is empty ');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Category List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.fetchFieldNameListForRawData=function(){

		if(!ipamODECtrl.nodeName || !ipamODECtrl.rawCategory)
			return;

		ipamODECtrl.fieldNameList = [];

		var queryString="operation=getCnaCommonFieldNames";

		var header = {
			"X-Flow-Id" : Date.now(),
			"username":$rootScope.globals.currentUser.username,
			"nodeName": ipamODECtrl.nodeName
		};

		var finalObject = {
			"nodeName": ipamODECtrl.nodeName,
			"isCategorySpecific": ipamODECtrl.isCategorySpecific,
			"categoryList": [ipamODECtrl.rawCategory]
		}

		ATOMCommonServices.commonPostMethod(finalObject,Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){
				if( response.AppData.type == "SUCCESS"){

					ipamODECtrl.fieldNameList = response.AppData.appdata.resultList;

					if(ipamODECtrl.fieldNameList.length==0){
						ATOMService.showMessage('error','ERROR','Field Name List is empty. ');
					}
				}
				else {
					ATOMService.showMessage('error','ERROR','Unable to fetch Field Name List. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.changeSpecificForODE=function(aggr, aggrOn, nodeName){

		if(!aggr.specific)
		{
			if(aggr.specificList)
				aggr.specificList = [];

			if(aggr.manualSpecificList)
				aggr.manualSpecificList = [];

			return;
		}

		var queryString = "operation=getAggregationFieldValueList";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"fieldName": aggr.fieldName
		};

		header.aggregationOn = aggrOn;
		if(aggrOn != 'HNA')
		{
			header.nodeName = nodeName;
		}

		if(aggrOn === 'RAW' && aggr.category)
		{
			header.Category = aggr.category;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					aggr.specificValueList = response.AppData.appdata.resultList;
					
					if(aggr.specificValueList.length === 0) {
						ATOMService.showMessage('error','WARNING','Specific List is empty');
						//aggr.specific = false;
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Specific List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.customTimeRangeFn=function(action, data){

		if(action === 'FilterTypeChange')
		{
			ipamODECtrl.customTimeRange.customBucketSize = null;
			ipamODECtrl.customTimeRange.customBucketType = null;
		}
	}


	ipamODECtrl.bucketFunction=function(action, data){

		if(action === 'BucketTypeChange')
		{
			ipamODECtrl.hourInput = [];
			ipamODECtrl.hourList = [];
			ipamODECtrl.quarterInput = [];
			ipamODECtrl.quarterComboList = [];

			if(!ipamODECtrl.bucketType) {
				ipamODECtrl.bucketSize = "";
				ipamODECtrl.bucketSizeList = [];
			}
			else {

				if(['Minutes'].includes(ipamODECtrl.bucketType))
				{
					ipamODECtrl.bucketSize = "";
					ipamODECtrl.bucketSizeList = angular.copy(ipamODECtrl.setupBasedBucketSizeList);
				}
				else if(['Hours'].includes(ipamODECtrl.bucketType))
				{
					ipamODECtrl.quarterComboList = ipamODECtrl._.range(0,59,15);
					ipamODECtrl.bucketSize = 1;
					ipamODECtrl.bucketSizeList = [1];
				}
				else
				{
					ipamODECtrl.bucketSize = 1;
					ipamODECtrl.bucketSizeList = [1];
				}
			}
		}
		else if(action === 'BucketSizeChange')
		{
			if(['Minutes'].includes(ipamODECtrl.bucketType))
			{
				ipamODECtrl.hourInput = [];
				ipamODECtrl.hourList = [];
				ipamODECtrl.quarterInput = [];
				ipamODECtrl.quarterComboList = ipamODECtrl._.range(0,59,ipamODECtrl.bucketSize);
			}
		}
		else if(action === 'addAllHours')
		{
			ipamODECtrl.hourInput = ipamODECtrl._.range(24);
		}
		else if(action === 'removeAllHours')
		{
			ipamODECtrl.hourInput = [];
		}
		else if(action === 'addAllQuarters')
		{
			ipamODECtrl.quarterInput = angular.copy(ipamODECtrl.quarterComboList);
		}
		else if(action === 'removeAllQuarters')
		{
			ipamODECtrl.quarterInput = [];
		}
		else if(action === 'addToHourListTable')
		{
			ipamODECtrl.hourInput.forEach(hour=> {
				ipamODECtrl.quarterInput.forEach(quarter=> {
					if(!ipamODECtrl.hourList.find(el => el.hour === hour && el.minute === quarter))
					{
						ipamODECtrl.hourList.push({'hour': hour, 'minute': quarter});
					}
				})
			})
			ipamODECtrl.hourInput = [];
			ipamODECtrl.quarterInput = [];
			ipamODECtrl.sortHourArr(ipamODECtrl.hourList);
		}
		else if(action === 'addAllToHourListTable')
		{
			ipamODECtrl.hourList = [];
			ipamODECtrl._.range(24).forEach(hour=> {
				ipamODECtrl.quarterComboList.forEach(quarter=> {
					ipamODECtrl.hourList.push({'hour': hour, 'minute': quarter});
				});
			})
			ipamODECtrl.hourInput = [];
			ipamODECtrl.quarterInput = [];
			ipamODECtrl.sortHourArr(ipamODECtrl.hourList);
		}
		else if(action === 'clearHourListTable')
		{
			ipamODECtrl.hourList = [];
		}
		else if(action === 'addAllHourstoHourList')
		{
			ipamODECtrl._.range(24).forEach(hour=> {
				ipamODECtrl.hourList.push(hour);
			})
		}
		else if(action === 'removeAllHoursfromHourList')
		{
			ipamODECtrl.hourList = [];
		}
		else if(action === 'deleteFromHourListTable')
		{
			var deleteIndex = ipamODECtrl.hourList.findIndex(el => el === data);
			ipamODECtrl.hourList.splice(deleteIndex, 1);
		}
	}


	ipamODECtrl.sortHourArr=function(hourList){

		hourList.sort(function(a,b){
			if(a.hour === b.hour){
				return a.minute - b.minute;
			}
			else {
				return a.hour-b.hour;
			}
		})

	}


	ipamODECtrl.supportingDashboardFn=function(action, data, index){

		if(action === 'radioChange')
		{

			if(ipamODECtrl.supportingDashboardFlag)
			{
				ipamODECtrl.uploadedFileDetails = {"uploadedFilePath": "", "filterList": "", "modeKpiName": ""};
				ipamODECtrl.fileStatusForSD = "File Not Uploaded";

				try{
					$("#sdFileUploadEl").val("");
				}
				catch (e) {
				}

				if($scope.odesupportingdashboardform) {
					$scope.odesupportingdashboardform.$setUntouched();
					$scope.odesupportingdashboardform.$setPristine();
				}

				angular.element('#modalForSupportingDashboard').modal('show');
			}
			else {
				angular.element('#modalForSupportingDashboard').modal('hide');
				ipamODECtrl.uploadedFileDetails = {"uploadedFilePath": "", "filterList": "", "modeKpiName": ""};
				ipamODECtrl.fileStatusForSD = "File Not Uploaded";
				try{
					$("#sdFileUploadEl").val("");
				}
				catch (e) {
				}
			}
		}
		else if(action === 'openModal')
		{
			if(ipamODECtrl.supportingDashboardFlag && ipamODECtrl.uploadedFileDetails.uploadedFilePath)
			{
				ipamODECtrl.fileStatusForSD = "File Uploaded Successfully";
			}
			angular.element('#modalForSupportingDashboard').modal('show');
		}
		else if(action === 'resetForm')
		{
			ipamODECtrl.supportingDashboardFlag = true;
			ipamODECtrl.supportingDashboardFn('radioChange', null, null);
		}
		else if(action === 'apply')
		{
			if($scope.odesupportingdashboardform.$invalid)
			{
				ATOMService.showMessage('error','ERROR','Please enter valid supporting dashboard details. ');
				return;
			}

			angular.element('#modalForSupportingDashboard').modal('hide');
		}
	}


	$scope.excelFileChangeForSD=function(){

		$timeout(function(){
			$scope.$apply(function (){

				if(angular.element("#sdFileUploadEl")[0].files.length && angular.element('#sdFileUploadEl')[0].files[0].name){
					var fileName = angular.element('#sdFileUploadEl')[0].files[0].name;
					var fileType = fileName.split(".")[1];

					if(fileName && fileType === 'xlsx') {

						ipamODECtrl.uploadedFileDetails.uploadedFilePath = "";
						ipamODECtrl.fileStatusForSD = "Uploading...";
						var queryString = 'operation=uploadSheet';

						var header = {
							username: $rootScope.globals.currentUser.username,
							fileName: fileName,
							fileType: fileType,
							"Content-Type": undefined
						};

						var fileFormData = new FormData();
						fileFormData.append('file', ipamODECtrl.fileContentForSDExcel);
						console.log("******fileFormData******"+fileFormData);

						ATOMCommonServices.commonPostMethod(fileFormData,Constants.IPM_USER_TABULAR_DASHBOARD_CONTEXT,header,queryString).then(
							function successCallback(response){

								if( response.AppData.type === 'SUCCESS') {
									var results = response.AppData.appdata;

									if(results.UploadPath)
									{
										ipamODECtrl.uploadedFileDetails.uploadedFilePath = results.UploadPath;
										ipamODECtrl.fileStatusForSD = "File Uploaded Successfully";
									}
									else
									{
										ipamODECtrl.fileStatusForSD = "File Upload Failed";
										ATOMService.showMessage('error','WARNING','Unable to upload excel file. Please contact admin. ');
									}
								}
								else {
									ipamODECtrl.fileStatusForSD = "File Upload Failed";
									ATOMService.showMessage('error','WARNING','Unable to upload excel file. Please contact admin. ');
								}
							},
							function errorCallback(responseData){
								ipamODECtrl.fileStatusForSD = "File Upload Failed";
								ATOMService.showMessage('error','ERROR','server is not reachable');
						});
					}
					else {
						angular.element('#sdFileUploadEl').val('');
						ATOMService.showMessage('error','WARNING','Please upload .xlsx file only.');
					}
				}
				else
				{
					angular.element('#sdFileUploadEl').val('');
					ipamODECtrl.uploadedFileDetails.uploadedFilePath = "";
					ipamODECtrl.fileContentForSDExcel = null;
					ipamODECtrl.fileStatusForSD = "File Not Uploaded";
				}

			})
		}, 100);
	};


	ipamODECtrl.dynamicFilterCommonFn=function(action, data, index, calledFrom, dataObj){

		if(action === 'addMoreFields')
		{
			if(dataObj.length >= 50)
			{
				ATOMService.showMessage('error','ERROR','Maximum 50 filters are allowed. ');
				return;
			}

			dataObj.splice(index+1,0,{
				category: "",
				queryType: null,
				clause: null,
				subQueryType: null,
				fieldName: null,
				value: null,
				typeRange: null,

				isCategorySpecific: false,
				dynamicFieldViewList: [],
				termsValueFlag: false
			});

			if(calledFrom === 'dynamicFilterFn')
			{
				ipamODECtrl.fetchDynamicFieldNameList(index+1);
			}
			else if(calledFrom === 'dynamicFilterChangeFn')
			{
				ipamODECtrl.fetchFieldNameListForDFChange(index+1);
			}
		}
		else if(action === 'addMoreTermValue')
		{
			if(dataObj.length >= 50)
			{
				ATOMService.showMessage('error','ERROR','Maximum 50 filters are allowed. ');
				return;
			}

			var obj = dataObj[index];
			var fieldObj = obj.dynamicFieldViewList.find(el=> el.fieldname === obj.fieldName);

			dataObj.splice(index+1,0,{
				category: obj.category ? obj.category : "",
				queryType: obj.queryType,
				clause: obj.queryType === 'Boolean' ? obj.clause : null,
				subQueryType: obj.queryType === 'Boolean' ? obj.subQueryType : null,
				fieldName: obj.fieldName,
				value: null,
				typeRange: null,

				isCategorySpecific: obj.isCategorySpecific,
				dynamicFieldViewList: [fieldObj],
				termsValueFlag: true
			});
		}
		else if(action === 'categoryFlagChange')
		{
			var obj = dataObj[index];
			obj.category = "";

			if(obj.isCategorySpecific === false)
			{
				if(calledFrom === 'dynamicFilterFn')
				{
					ipamODECtrl.fetchDynamicFieldNameList(index);
				}
				else if(calledFrom === 'dynamicFilterChangeFn')
				{
					ipamODECtrl.fetchFieldNameListForDFChange(index+1);
				}
			}
			else
			{
				obj.dynamicFieldViewList = [];
				obj.fieldName = "";
				obj.category = "";

				if(calledFrom === 'dynamicFilterFn')
				{
					if(!ipamODECtrl.dynamicRawCategoryViewList.length)
						ipamODECtrl.fetchCategoryListForDynamicFilter();
				}
				else if(calledFrom === 'dynamicFilterChangeFn')
				{
					if(!ipamODECtrl.df.dynamicRawCategoryViewList.length)
						ipamODECtrl.fetchCategoryListForDFChange();
				}
			}
		}
		else if(action === 'categoryChange')
		{
			var obj = dataObj[index];
			obj.dynamicFieldViewList = [];
			obj.fieldName = null;

			if(calledFrom === 'dynamicFilterFn')
			{
				ipamODECtrl.fetchRAWFieldNameListForDynamicFilter(index);
			}
			else if(calledFrom === 'dynamicFilterChangeFn')
			{
				ipamODECtrl.fetchRAWFieldNameListForDFChange(index);
			}
		}
		else if(action === 'queryTypeChange')
		{
			var obj = dataObj[index];

			if(obj.queryType != 'Boolean')
			{
				obj.clause = null;
				obj.subQueryType = null;
			}

			if(obj.queryType === 'Range' || obj.subQueryType === 'Range')
			{
				obj.value = {
					startDate: null,
					endDate: null,
					minValue: null,
					maxValue: null
				}
			}
			else {
				obj.value = null;
			}
		}
		else if(action === 'typeRangeChange')
		{
			var obj = dataObj[index];
			obj.value = {
				startDate: null,
				endDate: null,
				minValue: null,
				maxValue: null
			}
		}

	}


	ipamODECtrl.dynamicFilterFn=function(action, data, index){

		if(action === 'radioChange')
		{
			if(!ipamODECtrl.aggregationOn)
				return;

			if(ipamODECtrl.dynamicFiltersFlag)
			{
				ipamODECtrl.dynamicRawCategoryViewList = [];

				ipamODECtrl.fieldData = [{
					category: "",
					queryType: null,
					clause: null,
					subQueryType: null,
					fieldName: null,
					value: null,
					typeRange: null,

					isCategorySpecific: false,
					dynamicFieldViewList: [],
					termsValueFlag: false
				}];

				ipamODECtrl.fetchDynamicFieldNameList(0);
				angular.element('#modalForDynamicFields').modal('show');
			}
			else {
				angular.element('#modalForDynamicFields').modal('hide');
			}

		}
		else if(action === 'addMoreFields')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterFn', ipamODECtrl.fieldData);
		}
		else if(action === 'addMoreTermValue')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterFn', ipamODECtrl.fieldData);
		}
		else if(action === 'delete')
		{
			if(ipamODECtrl.fieldData.length === 1)
			{
				ipamODECtrl.dynamicFiltersFlag = true;
				ipamODECtrl.dynamicFilterFn('radioChange')
			}
			else
			{
				ipamODECtrl.fieldData.splice(index,1);
			}
		}
		else if(action === 'resetForm')
		{
			ipamODECtrl.dynamicFiltersFlag = true;
			ipamODECtrl.dynamicFilterFn('radioChange')
		}
		else if(action === 'openModal')
		{
			angular.element('#modalForDynamicFields').modal('show');
		}
		else if(action === 'categoryFlagChange')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterFn', ipamODECtrl.fieldData);
		}
		else if(action === 'categoryChange')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterFn', ipamODECtrl.fieldData);
		}
		else if(action === 'queryTypeChange')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterFn', ipamODECtrl.fieldData);
		}
		else if(action === 'typeRangeChange')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterFn', ipamODECtrl.fieldData);
		}
		else if(action === 'apply')
		{
			if($scope.odedynamicfilterform.$invalid)
			{
				ATOMService.showMessage('error','ERROR','Please add valid filter values. ');
				return;
			}
			else if(!ipamODECtrl.fieldData.length)
			{
				ATOMService.showMessage('error','ERROR','Please add minimum one filter. ');
				return;
			}
			angular.element('#modalForDynamicFields').modal('hide');
		}
	}


	ipamODECtrl.fetchDynamicFieldNameList=function(index){

		var obj = ipamODECtrl.fieldData[index];

		var dynamicFilterEditFetchFlag = ipamODECtrl.dynamicFilterEditFetchFlag;

		obj.dynamicFieldViewList = [];

		if((ipamODECtrl.aggregationOn != 'HNA' && !ipamODECtrl.nodeName) || !ipamODECtrl.aggregationOn)
			return;

		var queryString = "operation=getAggregationFieldNameListForDynamicFilter";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"aggregationOn": ipamODECtrl.aggregationOn
		};

		if(ipamODECtrl.aggregationOn != 'HNA')
		{
			header.nodeName = ipamODECtrl.nodeName;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(

			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					obj.dynamicFieldViewList = response.AppData.appdata.resultList;

					if(!obj.dynamicFieldViewList || obj.dynamicFieldViewList.length === 0)
					{
						ATOMService.showMessage('error','WARNING','Field Name List is Empty. ');
					}
					else {

						if(dynamicFilterEditFetchFlag) {
							ipamODECtrl.fieldData.forEach((el,i)=>{
								if(!el.isCategorySpecific)
								{
									ipamODECtrl.fieldData[i].dynamicFieldViewList = angular.copy(obj.dynamicFieldViewList);
								}
							});
						}
					}
				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch Field Name List. Please contact admin. ');
				}
			},
			function errorCallback(responseData) {
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

	}

	ipamODECtrl.fetchCategoryListForDynamicFilter=function(){

		if(ipamODECtrl.aggregationOn != 'RAW')
			return;

		if(!ipamODECtrl.nodeName)
			return;

		var queryString="operation=getCounterCategoryList";

		var header= {
			"username":$rootScope.globals.currentUser.username,
			"nodeName": ipamODECtrl.nodeName
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT, header, queryString).then(
			function successCallback(response) {
				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.dynamicRawCategoryViewList = response.AppData.appdata.resultList;
					if(ipamODECtrl.dynamicRawCategoryViewList.length === 0) {
						ATOMService.showMessage('error','WARNING','Category List is empty ');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Category List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.fetchRAWFieldNameListForDynamicFilter=function(index){

		var obj = ipamODECtrl.fieldData[index];

		if(!ipamODECtrl.nodeName || !obj.category)
			return;

		var queryString="operation=getCnaCommonFieldNamesWithType";

		var header = {
			"X-Flow-Id" : Date.now(),
			"username":$rootScope.globals.currentUser.username
		};

		var finalObject = {
			"nodeName": ipamODECtrl.nodeName,
			"isCategorySpecific": obj.isCategorySpecific ? 'true' : 'false',
			"categoryList": [obj.category]
		}

		ATOMCommonServices.commonPostMethod(finalObject,Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){
				if( response.AppData.type == "SUCCESS"){

					obj.dynamicFieldViewList = response.AppData.appdata.resultList;

					if(obj.dynamicFieldViewList.length==0){
						ATOMService.showMessage('error','ERROR','Field Name List is empty. ');
					}
				}
				else {
					ATOMService.showMessage('error','ERROR','Unable to fetch Field Name List. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	$scope.checkValue=function(min, max,type){

		if(min != null && max != null) {
			if(type === "Date") {
				var diff = Date.parse(max)-Date.parse(min);

				if(diff<0) {
					ATOMService.showMessage("error","Error","Start date cannot be greater than the End Date.");
				}
			}
		}
	}


	$scope.checkValueNew=function(min, max,type){

		if(min != null && max != null) {

			if(type=='Value') {

				if(parseFloat(max)<parseFloat(min)) {
					ATOMService.showMessage("error","Error","Max value cannot be less than min value. ");
				} else {
					ATOMService.showMessage("success","SUCCESS","Correct assignment of values. ");
				}
			}

		}
	}


	ipamODECtrl.confirmAction=function(action, title, text, data){
		ipamODECtrl.confrmAction = action;
		ipamODECtrl.confrmTitle = title;
		ipamODECtrl.confrmText = text;
		ipamODECtrl.confrmData = data;
		angular.element('#modalForConfirmation').modal('show');
	}


	ipamODECtrl.submitAction=function(){
		if(ipamODECtrl.confrmAction === 'ODE')
			ipamODECtrl.onDemandExecutionFunction(false);
		if(ipamODECtrl.confrmAction === 'ODEWithExecutionName')
			ipamODECtrl.onDemandExecutionFunction(false);
		else if(ipamODECtrl.confrmAction === 'ExecuteAndDownloadAsExcel')
			ipamODECtrl.downloadReportAsExcel(false);
	}


	ipamODECtrl.clearODEExecutionResult=function(){

		ipamODECtrl.finalData = [];
		ipamODECtrl.showPanelForExecutionResult = false;

		ipamODECtrl.isSubmittedForExecution = false;
		ipamODECtrl.searchExecResult = [];
		ipamODECtrl.searchExecSummaryResult = [];
		ipamODECtrl.freezeColumnUpTo = 0;

		ipamODECtrl.filterObj = {
			index: -1,
			startTime: "",
			endTime: "",
			startDate: "",
			endDate: "",
			bucketType: "",
			bucketSize: "",
			hourList: [],
			numberOfBucket:"",
			bucketTypeList: ["Minutes","Hours","Days","Weeks","Months","Years"],
			networkElement: null,
			timeSelectionType: "",
			customTimeRange: null,
			selectiveDatesModel: "",
			selectiveDates: [],
			disableSelectiveDates: false
		};

	}


	ipamODECtrl.viewModalForODEInfo=function(action, data, type){

		if(action === 'openModal')
		{
			ipamODECtrl.queryinfo = { ne: data, infoType: "", type: type };

			if(type === 'header')
			{
				ipamODECtrl.queryinfo.infoType = 'header';
			}
			else if(type === 'aggregation')
			{
				ipamODECtrl.queryinfo.infoType = 'Aggregation Field';
			}
			else if(type === 'dynamic filters')
			{
				ipamODECtrl.queryinfo.infoType = 'Dynamic Filters';
			}

			angular.element('#modalForODEInfo').modal('show');
		}
		else if(action === 'deleteRow')
		{
			var elementIndexInArr = -1;
			var ne = ipamODECtrl.queryinfo.ne;

			if(ipamODECtrl.queryinfo.type === 'header')
			{
				if(ne.headerList.length === 1)
				{
					ATOMService.showMessage('error','WARNING','Deletion not allowed as minimum one header row is required. ');
					return;
				}
				elementIndexInArr = ne.headerList.findIndex(el => el === data);

				ne.headerList.splice(elementIndexInArr,1);
			}
			else if(ipamODECtrl.queryinfo.type === 'aggregation')
			{
				if(ne.aggregationList.row.length === 1 && ne.aggregationOperationType === 'hierachyBasedAggregation') {
					ATOMService.showMessage('error','WARNING','Deletion not allowed as minimum one Aggregation row is required while performing Hierarchy Based Aggregation. ');
					return;
				}

				elementIndexInArr = ne.aggregationList.row.findIndex(el => el === data);

				if(ne.transposeFlag && ne.aggregationList.row[elementIndexInArr].fieldName === ne.transposeJSON.fieldName) {
					ATOMService.showMessage('error','WARNING','Deletion not allowed as Transpose operations is performed on this aggregation row. ');
					return;
				}

				if(ne.summaryFlag && ne.aggregationList.row[elementIndexInArr].fieldName === ne.summaryJSON.fieldName) {
					ATOMService.showMessage('error','WARNING','Deletion not allowed as summary transpose operations is performed on this aggregation row. ');
					return;
				}

				ne.aggregationList.row.splice(elementIndexInArr,1);

				var aggrLevel = 1;
				ne.aggregationList.row.map(el => { el.level = aggrLevel++; return el; });
			}

		}
	}


	ipamODECtrl.modalForViewKpiRowFn=function(kpi){

		ipamODECtrl.vkpi = angular.copy(kpi);
		angular.element('#modalForViewKpiRow').modal('show');	
	}


	ipamODECtrl.modalForViewCounterRowFn=function(action, data){

		if(action === 'openModal')
		{
			ipamODECtrl.counterRowObj = {};
			ipamODECtrl.counterRowObj.counter = angular.copy(data);
			angular.element('#modalForViewCounterRow').modal('show');
		}
	}


	ipamODECtrl.addNetworkElementForODE=function(){

		ipamODECtrl.search="";

		var networkElement = {
			assigneduser: ipamODECtrl.assigneduser,
			accessData: ipamODECtrl.accessData,
			createdBy: ipamODECtrl.createdBy ? ipamODECtrl.createdBy : $rootScope.globals.currentUser.username,
			userTag: ipamODECtrl.userTag,
			fileFormat: ipamODECtrl.fileFormat ? ipamODECtrl.fileFormat : 'excel',
			executionType: ipamODECtrl.executionType,
			dataSourceName: null,
			headerPosition: ipamODECtrl.headerPosition,
			reportType: ipamODECtrl.reportType,
			counterType: ipamODECtrl.counterType,
			aggregationOn: ipamODECtrl.aggregationOn,
			aggregationOperationType: ipamODECtrl.aggregationOperationType,
			totalExecFlag: ipamODECtrl.totalExecFlag,
			anomalyDashboard: !!ipamODECtrl.anomalyDashboard,
			executionMode: ipamODECtrl.executionMode,
			aggregationList: { 'row': ipamODECtrl.aggregationList },
			transposeFlag: false,
			headerList: ipamODECtrl.headerList,
			counter: 4,
			fiveMinuteFlag: ipamODECtrl.setupBasedBucketSizeList.includes(5)
		}
		if(ipamODECtrl.jempCircle){
			networkElement.jempCircle=ipamODECtrl.jempCircle
		}
		if(ipamODECtrl.dashboardName)
		{
			networkElement.dashboardName = ipamODECtrl.dashboardName;
		}

		if(ipamODECtrl.version)
		{
			networkElement.version = ipamODECtrl.version;
		}

		if(ipamODECtrl.executionType === 'SingleProduct') {
			networkElement.nodeName = ipamODECtrl.nodeName;
		}

		if((!networkElement.aggregationList.row || networkElement.aggregationList.row.length === 0) && networkElement.aggregationOperationType === 'hierachyBasedAggregation') {
			ATOMService.showMessage('error','WARNING','Please add atleast one Aggregation row while performing Hierarchy Based Aggregation. ');
			return;
		}

		/*if(networkElement.aggregationOn === 'HNA' && networkElement.aggregationList.row.length > 1) {
			ATOMService.showMessage('error','WARNING','Please add atmost one Aggregation row while performing aggregation on HNA. ');
			return;
		}*/
		

		// headers
		if(!networkElement.headerList || networkElement.headerList.length === 0) {
			ATOMService.showMessage('error','WARNING','Headers table is empty. ');
			return;
		}

		if(networkElement.reportType === 'Counter' && networkElement.counterType === "specificCategory")
		{
			networkElement.specificCategoryList = ipamODECtrl.categoryNameList;

			if(!networkElement.specificCategoryList || networkElement.specificCategoryList.length === 0) {
				ATOMService.showMessage('error','WARNING','Please select Specific Category. ');
				return;
			}
		}

		if(networkElement.aggregationOperationType === 'timeBasedAggregation')
		{
			networkElement.timeAscFlag = !!ipamODECtrl.timeAscFlag; 
		}

		if(networkElement.aggregationOperationType === 'hierachyBasedAggregation')
		{
			var deltaTrueFirstRecord = networkElement.headerList.find(el=> el.type === 'kpi' && el.deltaExecFlag);
			if(deltaTrueFirstRecord)
			{
				ATOMService.showMessage('error','ERROR','Delta Execution can not be possible with Hierarchy Based Aggregation, Please disabled the delta execution flag for header with KPI Name : ' + deltaTrueFirstRecord.name);
				return;
			}
		}

		if(networkElement.headerPosition === 'row')
		{
			networkElement.headerList.forEach(el => {

				if(el.type === 'kpi')
				{
					el.deltaExecFlag = false;
					el.valueCompareFromBaseFlag = null;
					el.percentageFlag = false;
					el.dayDiff = null;
					el.dayDiffDeltaFlag = false;
					el.operationType = null;
				}
			});
			if(networkElement.headerPosition === 'row' && networkElement.aggregationOperationType === 'timeBasedAggregation' && networkElement.aggregationList && networkElement.aggregationList.row && networkElement.aggregationList.row.length >= 1  && ipamODECtrl.transposeFlag)
			{
				networkElement.transposeFlag = true;
				networkElement.transposeJSON = angular.copy(ipamODECtrl.transposeJSON);
				networkElement.transposeJSON.fieldPosition = networkElement.aggregationList.row.find(el=> el.fieldName === networkElement.transposeJSON.fieldName).level-1;
			}

			if(networkElement.headerPosition === 'row' && networkElement.aggregationList && networkElement.aggregationList.row && networkElement.aggregationList.row.length >= 1 && networkElement.reportType === 'Kpi' && ipamODECtrl.summaryFlag)
			{
				networkElement.summaryFlag = true;
				networkElement.summaryJSON = angular.copy(ipamODECtrl.summaryJSON);
				networkElement.summaryJSON.fieldPosition = networkElement.aggregationList.row.find(el=> el.fieldName === networkElement.summaryJSON.fieldName).level-1;
			}
		}
		else if(networkElement.headerPosition === 'column')
		{
			if(networkElement.headerList.find(el=> el.type === 'kpi' && el.deltaExecFlag))
			{
				var invalidDeltaKpi = networkElement.headerList.find(el=> {

					if(el.type === 'kpi' && el.deltaExecFlag &&
							(!el.operationType
									|| (!el.dayDiff && el.dayDiff !== 0)
									|| (![true,false].includes(el.valueCompareFromBaseFlag)))
					) {
						return true;
					}
					else
					{
						return false;
					}
				});

				if(invalidDeltaKpi)
				{
					ATOMService.showMessage('error','ERROR','Please enter valid delta data for KPI: ' + invalidDeltaKpi.name);
					return;
				}

				networkElement.maxDayDiff = ipamODECtrl.getMaxDayDiff(networkElement.headerList);
			}

		}

		networkElement.isNestedNhPresentFlag = ipamODECtrl.getIsNestedNhPresentFlag(networkElement.headerList);
		networkElement.isNhPresentFlag = ipamODECtrl.getIsNhPresentFlag(networkElement.headerList);
		networkElement.maxAgingPeriod = ipamODECtrl.getMaxAgingPeriod(networkElement.headerList);
		networkElement.nestedTimeShiftFlag = ipamODECtrl.getNestedTimeShiftFlag(networkElement.headerList);
		networkElement.isNotMissing = ipamODECtrl.getIsNotMissingFlag(networkElement.headerList);
		// networkElement.maxTimeShiftValue = ipamODECtrl.getMaxTimeShiftValue(networkElement.headerList);
		networkElement.maxConsecutiveInterval = ipamODECtrl.getMaxConsecutiveInterval(networkElement.headerList);
		networkElement.agingFlag = ipamODECtrl.getAgingFlag([networkElement]);
		networkElement.modeFlag = ipamODECtrl.getModeFlag(networkElement.headerList);
		if(ipamODECtrl.getConsecutiveFlag([networkElement]))
			networkElement.consecutiveFlag = true;

		if(ipamODECtrl.headerFilterFlag)
		{

			if(!ipamODECtrl.headerFilterList.length)
			{
				ATOMService.showMessage('error','ERROR','Please add minimum one header filter. ');
				return;
			}

			networkElement.headerFilterFlag = true;
			networkElement.headerFilterList = angular.copy(ipamODECtrl.headerFilterList);
		}


		if(networkElement.executionType === 'SingleProduct' && ipamODECtrl.attributesFlag)
		{

			if(
				(networkElement.aggregationOperationType==='timeBasedAggregation'
					&& networkElement.aggregationList.row.length >= 1)
				||
				(networkElement.aggregationOperationType==='hierachyBasedAggregation'
					&& networkElement.headerPosition==='column'
					&& networkElement.aggregationList.row.length >= 1)
				|| (networkElement.aggregationOperationType==='hierachyBasedAggregation'
						&& networkElement.headerPosition==='row'
						&& networkElement.aggregationList.row.length >= 2
					)
			) {
				if(!ipamODECtrl.attributes.length)
				{
					ATOMService.showMessage('error','ERROR','Please select Attributes. ');
					return;
				}

				var attributes = angular.copy(ipamODECtrl.attributes);
				attributes.forEach(el=> {
					if(!el.values || !el.values.length)
						delete el.values;
					delete el.attributeValueList;
				});

				networkElement.attributes = attributes;
				networkElement.attributesFlag = ipamODECtrl.attributesFlag;
				networkElement.hideEmptyAttribute = !!ipamODECtrl.hideEmptyAttribute;
			}
		}

		if(ipamODECtrl.dynamicFiltersFlag)
		{

			if($scope.odedynamicfilterform.$invalid)
			{
				ATOMService.showMessage('error','ERROR','Please add valid dynamic filter values. ');
				return;
			}
			else if(!ipamODECtrl.fieldData.length)
			{
				ATOMService.showMessage('error','ERROR','Please add minimum one filter. ');
				return;
			}

			networkElement.fieldData = ipamODECtrl.prepareDynamicFieldData(angular.copy(ipamODECtrl.fieldData));
		}

		if(ipamODECtrl.supportingDashboardFlag)
		{

			if($scope.odesupportingdashboardform.$invalid
				|| !ipamODECtrl.uploadedFileDetails.uploadedFilePath
				|| !ipamODECtrl.uploadedFileDetails.filterList
				|| !ipamODECtrl.uploadedFileDetails.modeKpiName
				)
			{
				ATOMService.showMessage('error','ERROR','Please enter valid supporting dashboard details. ');
				return;
			}

			let filterList = ipamODECtrl.uploadedFileDetails.filterList.split(',').map(el=> el.trim()).filter(el=> !!el);

			if(!filterList.length)
			{
				ATOMService.showMessage('error','ERROR','Please enter valid supporting dashboard details. ');
				return;
			}

			let uploadedFileDetails = angular.copy(ipamODECtrl.uploadedFileDetails);
			uploadedFileDetails.filterList = filterList;
			networkElement.uploadedFileDetails = uploadedFileDetails;
			networkElement.supportingDashboardFlag = true;
		}
		else
		{
			networkElement.supportingDashboardFlag = false;
		}

		networkElement.timeSelectionType = ipamODECtrl.timeSelectionType;

		// time selection

		if(!ipamODECtrl.timeSelectionType && ipamODECtrl.executionMode === 'Manual')
		{
			ATOMService.showMessage('error','ERROR','Please select time selection type. ');
			return;
		}
		else if(ipamODECtrl.timeSelectionType === 'none')
		{
			// do nothing
		}
		else if(ipamODECtrl.timeSelectionType === 'timeInterval')
		{
			if(!ipamODECtrl.startTime || !ipamODECtrl.endTime)
			{
				ATOMService.showMessage('error','ERROR','Please enter time period. ');
				return;
			}

			var startTimeModified = ipamODECtrl.setZeroTimePart('add',networkElement,ipamODECtrl.startTime);
			var endTimeModified = ipamODECtrl.setZeroTimePart('add',networkElement,ipamODECtrl.endTime);

			if(moment(startTimeModified, "YYYY-MM-DD-HH:mm:ss") > moment(endTimeModified, "YYYY-MM-DD-HH:mm:ss")){
				ATOMService.showMessage('error','ERROR','End time can not be less than start time. ');
				return;
			}

			networkElement.startTime = startTimeModified;
			networkElement.endTime = endTimeModified;
		}
		else if(ipamODECtrl.timeSelectionType === 'pastNthDay')
		{
			if(!ipamODECtrl.networkDayDiff && ipamODECtrl.networkDayDiff != 0)
			{
				ATOMService.showMessage('error','ERROR','Please enter Past Nth Day value. ');
				return;
			}
			networkElement.networkDayDiff = ipamODECtrl.networkDayDiff;
		}
		else if(ipamODECtrl.timeSelectionType === 'customTimeRange')
		{
			if(!ipamODECtrl.customTimeRange.filterType)
			{
				ATOMService.showMessage('error','ERROR','Please enter custom time range details. ');
				return;
			}
			else if(ipamODECtrl.customTimeRange.filterType === 'Last' && (!ipamODECtrl.customTimeRange.customBucketType || (!ipamODECtrl.customTimeRange.customBucketSize && ipamODECtrl.customTimeRange.customBucketSize != 0)))
			{
				ATOMService.showMessage('error','ERROR','Please enter valid custom time range details. ');
				return;
			}

			networkElement.customTimeRange = {
				filterType: ipamODECtrl.customTimeRange.filterType
			};

			if(ipamODECtrl.customTimeRange.filterType === 'Last')
			{
				networkElement.customTimeRange.customBucketType = ipamODECtrl.customTimeRange.customBucketType;
				networkElement.customTimeRange.customBucketSize = ipamODECtrl.customTimeRange.customBucketSize;
			}
		}
		else if(ipamODECtrl.timeSelectionType === 'selectiveDates')
		{
			if(!ipamODECtrl.selectiveDates || !ipamODECtrl.selectiveDates.length)
			{
				ATOMService.showMessage('error','ERROR','Selective dates is required field. ');
				return;
			}

			networkElement.selectiveDates = ipamODECtrl.selectiveDates;
		}


		if(ipamODECtrl.executionMode === 'RealTime' && ['timeInterval','selectiveDates'].includes(ipamODECtrl.timeSelectionType))
		{
			networkElement.timeSelectionType = 'none';
			delete networkElement.startTime;
			delete networkElement.endTime;
			delete networkElement.selectiveDates;
		}

		if(ipamODECtrl.executionMode === 'RealTime' && ipamODECtrl.timeSelectionType && ['pastNthDay','customTimeRange'].includes(ipamODECtrl.timeSelectionType))
		{
			networkElement.realTimeExecutionWithTimeSelectionFlag = true;
		}

		if((ipamODECtrl.hourInput && ipamODECtrl.hourInput.length) || (ipamODECtrl.quarterInput && ipamODECtrl.quarterInput.length))
		{
			ATOMService.showMessage('error','ERROR','Hour/Quarter values selected. Either clear input fields or add valid data to quarter table.');
			return;
		}

		if(ipamODECtrl.hourList && ipamODECtrl.hourList.length) {
			networkElement.hourList = ipamODECtrl.hourList;
		}

		// bucket type,size and hourlist add if available
		if(networkElement.aggregationOperationType === 'timeBasedAggregation')
		{

			networkElement.bucketType = ipamODECtrl.bucketType;
			networkElement.bucketSize = ipamODECtrl.bucketSize;
			networkElement.counter = ipamODECtrl.getCounterValueUsingBucket(ipamODECtrl.bucketType, ipamODECtrl.bucketSize);

			if(ipamODECtrl.numberOfBucket || ipamODECtrl.numberOfBucket === 0)
			{
				networkElement.numberOfBucket = ipamODECtrl.numberOfBucket;
			}
		}

		if(ipamODECtrl.offsetBucketType) {
			networkElement.offsetBucketType = ipamODECtrl.offsetBucketType;
			networkElement.offsetBucketValue = ipamODECtrl.offsetBucketValue;
		}

		// prepare aggregation data for submission
		if(networkElement.aggregationList && networkElement.aggregationList.row && networkElement.aggregationList.row.length)
		{
			networkElement.aggregationList.row.forEach(aggr=> ipamODECtrl.prepareAndSyncSpecificList(aggr, false));
			networkElement.aggregationList.row.forEach(aggr=> {
				if(!aggr.manualSpecificList.length)
				{
					aggr.specific = false;
				}
			});
		}

		if(ipamODECtrl.crudOperation === 'Update' && ipamODECtrl.neEditIndex >= 0)
		{
			ipamODECtrl.networkElementList[ipamODECtrl.neEditIndex] = networkElement;
		}
		else
		{
			ipamODECtrl.networkElementList.push(networkElement);
		}


		$timeout(function(){
			try {
				$('html,body').animate({scrollTop: $('#odeNodeList').offset().top - 200 }, "slow");
			} catch (error) {
				console.error(error);
			}
		},500);

		ipamODECtrl.clearODEData('form');
	}


	ipamODECtrl.prepareDynamicFieldData=function(fieldData){

		fieldData.forEach(el=> {

			delete el.dynamicFieldViewList;

			if(el.queryType != 'Boolean')
			{
				delete el.clause;
				delete el.subQueryType;
			}


			if((el.queryType === 'Range' || el.subQueryType === 'Range') && el.typeRange === 'Date')
			{
				delete el.value.minValue;
				delete el.value.maxValue;
			}
			else if((el.queryType === 'Range' || el.subQueryType === 'Range') && el.typeRange === 'Value')
			{
				delete el.value.startDate;
				delete el.value.endDate;
			}
			else if(el.queryType === 'Exist' || el.subQueryType === 'Exist')
			{
				delete el.value
			}
			else
			{
				delete el.typeRange;

				if(!el.value && el.value != 0)
				{
					el.value = "";
				}
			}
		});

		return fieldData;
	}


	ipamODECtrl.getMaxDayDiff=function(headerList){

		var max = 0;
		headerList.filter(el=> el.deltaExecFlag).forEach(el=> {
			if(el.dayDiff > max)
				max = el.dayDiff;
		});
		return max;
	}


	ipamODECtrl.getModeFlag=function(headerList){
		return headerList.some(el => el.type === 'kpi' && el.modeFlag);
	}


	ipamODECtrl.getIsNestedNhPresentFlag=function(headerList){
		return headerList.some(el => el.type === 'kpi' && el.isNestedNhPresentFlag);
	}


	ipamODECtrl.getIsNhPresentFlag=function(headerList){
		return headerList.some(el => el.type === 'kpi' && el.isNhPresentFlag);
	}


	ipamODECtrl.getMaxAgingPeriod=function(headerList){

		var max = 0;
		headerList.filter(el=> el.agingFlag).forEach(el=> {
			if(el.agingPeriod > max)
				max = el.agingPeriod;
		});
		return max;
	}


	ipamODECtrl.getMaxTimeShiftValue=function(headerList){

		var max = 0;
		headerList.filter(el=> el.nestedTimeShiftFlag || el.isTimeShift).forEach(el=> {
			if(el.timeShiftValue > max)
				max = el.timeShiftValue;
		});
		return max;
	}


	ipamODECtrl.getNestedTimeShiftFlag=function(headerList){
		return headerList.some(el=> el.nestedTimeShiftFlag || el.isTimeShift);
	}


	ipamODECtrl.getIsNotMissingFlag=function(headerList){
		return headerList.some(el=> el.isNotMissing);
	}


	ipamODECtrl.getMaxConsecutiveInterval=function(headerList){

		var max = 0;
		headerList.filter(el=> el.nestedConsecutiveFlag || el.consecutiveFlag).forEach(el=> {
			if(el.nestedConsecutiveInterval > max)
				max = el.nestedConsecutiveInterval;
			if(el.interval > max)
				max = el.interval;
		});
		return max;
	}


	ipamODECtrl.editNetworkElementForODE=function(action, index){

		if(action === 'startEdit')
		{
			if($rootScope.streamingFlag) {
				ATOMService.showMessage('error','WARNING','You have to stop live stream in order to perform the action. ');
				return;
			}

			var networkElement = angular.copy(ipamODECtrl.networkElementList[index]);

			ipamODECtrl.clearODEData('form');

			// clear execution results
			if(ipamODECtrl.finalData && ipamODECtrl.finalData.length)
				ipamODECtrl.clearODEExecutionResult();

			ipamODECtrl.crudOperation = 'Update';
			ipamODECtrl.neEditIndex = index;

			ipamODECtrl.assigneduser = networkElement.assigneduser;
			ipamODECtrl.accessData = networkElement.accessData;
			ipamODECtrl.createdBy = networkElement.createdBy;
			ipamODECtrl.userTag = networkElement.userTag;
			ipamODECtrl.fileFormat = networkElement.fileFormat ? networkElement.fileFormat : 'excel';

			ipamODECtrl.dashboardName = networkElement.dashboardName;
			ipamODECtrl.version = networkElement.version;
			ipamODECtrl.executionType = networkElement.executionType;
			ipamODECtrl.jempCircle=networkElement.jempCircle;
			ipamODECtrl.headerPosition = networkElement.headerPosition;
			ipamODECtrl.reportType = networkElement.reportType;
			ipamODECtrl.counterType = networkElement.counterType;
			ipamODECtrl.aggregationOn = networkElement.aggregationOn;
			ipamODECtrl.aggregationOperationType = networkElement.aggregationOperationType;
			ipamODECtrl.timeAscFlag = !!networkElement.timeAscFlag;
			ipamODECtrl.totalExecFlag = networkElement.totalExecFlag;
			ipamODECtrl.anomalyDashboard = !!networkElement.anomalyDashboard;
			ipamODECtrl.executionMode = networkElement.executionMode;
			ipamODECtrl.aggregationList = networkElement.aggregationList.row;

			if(networkElement.executionType === 'SingleProduct') {
				ipamODECtrl.nodeName = networkElement.nodeName;
			}

			if(networkElement.reportType === 'Counter')
			{
				if(networkElement.counterType === "specificCategory")
				{
					ipamODECtrl.categoryNameList = networkElement.specificCategoryList;
				}

				if(networkElement.executionType == 'SingleProduct')
				{
					ipamODECtrl.getSubApplicableAndSubNeList();
					ipamODECtrl.getODECounterCategoryList();
				}
				else
				{
					ipamODECtrl.clearODEData('Counter');
				}
			}

			if(networkElement.reportType === 'Kpi')
			{

				if(networkElement.executionType == 'SingleProduct')
				{
					ipamODECtrl.getODEKPIList();
				}
				else
				{
					ipamODECtrl.clearODEData('Kpi');
				}

			}

			ipamODECtrl.headerList = networkElement.headerList

			if(networkElement.headerFilterFlag)
			{
				ipamODECtrl.headerFilterFlag =	true;
				ipamODECtrl.headerFilterList = networkElement.headerFilterList;
			}
			else {
				ipamODECtrl.headerFilterFlag =	false;
				ipamODECtrl.headerFilterList = [];
			}

			if(networkElement.executionType === 'SingleProduct' && networkElement.attributes && networkElement.attributes.length)
			{
				ipamODECtrl.attributesFlag = true;
				ipamODECtrl.attributes = networkElement.attributes;
				ipamODECtrl.hideEmptyAttribute = !!networkElement.hideEmptyAttribute;
				ipamODECtrl.fetchODEAttributesList();
			}
			else {
				ipamODECtrl.attributesFlag = false;
				ipamODECtrl.attributes = [];
				ipamODECtrl.hideEmptyAttribute = false;
			}

			if(networkElement.fieldData && networkElement.fieldData.length)
			{

				ipamODECtrl.dynamicRawCategoryViewList = [];
				ipamODECtrl.dynamicFiltersFlag = true;
				ipamODECtrl.fieldData = networkElement.fieldData;

				if(ipamODECtrl.aggregationOn === 'RAW')
					ipamODECtrl.fetchCategoryListForDynamicFilter();

				try {
					ipamODECtrl.dynamicFilterEditFetchFlag = true;
					var notSpecificIndex = ipamODECtrl.fieldData.findIndex(el => !el.isCategorySpecific);
					if(notSpecificIndex != -1)
						ipamODECtrl.fetchDynamicFieldNameList(notSpecificIndex);
				}
				catch(error) { console.error(error); }
				finally {
					ipamODECtrl.dynamicFilterEditFetchFlag = false;
				}

				ipamODECtrl.fieldData.forEach((el,index)=>{
					if(ipamODECtrl.aggregationOn === 'RAW' && el.isCategorySpecific)
					{
						ipamODECtrl.fetchRAWFieldNameListForDynamicFilter(index);
					}

					// convert string to date
					if((el.queryType === 'Range' || el.subQueryType === 'Range') && el.typeRange === 'Date')
					{
						el.value.startDate = new Date(el.value.startDate);
						el.value.endDate = new Date(el.value.endDate);
					}
				});
			}
			else
			{
				ipamODECtrl.dynamicFiltersFlag = false;
			}

			if(networkElement.supportingDashboardFlag)
			{
				ipamODECtrl.supportingDashboardFlag = true;
				ipamODECtrl.uploadedFileDetails = angular.copy(networkElement.uploadedFileDetails);
				ipamODECtrl.uploadedFileDetails.filterList = ipamODECtrl.uploadedFileDetails.filterList.join(",");
			}
			else
			{
				ipamODECtrl.supportingDashboardFlag = false;
				ipamODECtrl.uploadedFileDetails = {"uploadedFilePath": "", "filterList": "", "modeKpiName": ""};
				try{
					$("#sdFileUploadEl").val("");
				}
				catch (e) {
				}

				if($scope.odesupportingdashboardform) {
					$scope.odesupportingdashboardform.$setUntouched();
					$scope.odesupportingdashboardform.$setPristine();
				}
			}

			ipamODECtrl.timeSelectionType = networkElement.timeSelectionType;

			// set start time and end time
			ipamODECtrl.setODEFormDate(networkElement);

			// set networkDayDiff Execute For Past (N) Days
			if(networkElement.networkDayDiff || networkElement.networkDayDiff === 0)
				ipamODECtrl.networkDayDiff = networkElement.networkDayDiff;

			if(networkElement.selectiveDates)
			ipamODECtrl.selectiveDates = networkElement.selectiveDates;

			if(networkElement.customTimeRange)
				ipamODECtrl.customTimeRange = networkElement.customTimeRange;

			if(networkElement.hourList && networkElement.hourList.length) {
				ipamODECtrl.hourList = networkElement.hourList;
			}

			// bucket type,size and hourlist add if available
			if(networkElement.aggregationOperationType === 'timeBasedAggregation')
			{
				if(networkElement.bucketType)
				{
					ipamODECtrl.bucketType = networkElement.bucketType;
					ipamODECtrl.bucketSize = networkElement.bucketSize;

					if(['Minutes'].includes(ipamODECtrl.bucketType))
					{
						ipamODECtrl.bucketSizeList = angular.copy(ipamODECtrl.setupBasedBucketSizeList);
						ipamODECtrl.quarterComboList = ipamODECtrl._.range(0,59,networkElement.bucketSize);
					}
					else if(['Hours'].includes(ipamODECtrl.bucketType))
					{
						ipamODECtrl.bucketSizeList = [1];
						ipamODECtrl.quarterComboList = ipamODECtrl._.range(0,59,15);
					}
					else
					{
						ipamODECtrl.bucketSizeList = [1];
					}
				}
				else
				{
					ipamODECtrl.bucketSizeList = [];
				}
			}

			if(networkElement.aggregationOperationType != 'hierachyBasedAggregation' && (networkElement.numberOfBucket || networkElement.numberOfBucket === 0))
			{
				ipamODECtrl.numberOfBucket = networkElement.numberOfBucket;
			}

			if(networkElement.offsetBucketType) {
				ipamODECtrl.offsetBucketType = networkElement.offsetBucketType;
				ipamODECtrl.offsetBucketValue = networkElement.offsetBucketValue;
			}

			ipamODECtrl.fetchODEFiledNameList();

			ipamODECtrl.aggregationList.forEach(aggr=> {
				if(aggr.specific && !aggr.specificValueList)
					ipamODECtrl.changeSpecificForODE(aggr, ipamODECtrl.aggregationOn, ipamODECtrl.nodeName);

				var aggrCopy = angular.copy(aggr);

				$timeout(function(){
					aggr.manualSpecificList = aggrCopy.manualSpecificList;
				},400);
			});

			ipamODECtrl.transposeFlag = !!networkElement.transposeFlag;

			if(ipamODECtrl.transposeFlag){
				ipamODECtrl.transposeJSON = angular.copy(networkElement.transposeJSON);
				ipamODECtrl.transposeFn('fillFieldNameList');
			}

			ipamODECtrl.summaryFlag = !!networkElement.summaryFlag;

			if(ipamODECtrl.summaryFlag){
				ipamODECtrl.summaryJSON = angular.copy(networkElement.summaryJSON);
				ipamODECtrl.summaryFn('fillFieldNameList');
			}
		}

	}


	ipamODECtrl.getDashboardDoubleAggregationPresentFlag=function(networkElementList){

		var result = false;
		var busyArr = ["busyHour","busyHourValue","busyQuarter","busyQuarterValue"];

		networkElementList.forEach(networkElement=> {
			if(networkElement.headerList.some(el => el.type === 'kpi' && (el.isNestedDual || el.supportingKpi|| busyArr.includes(el.timeBasedAggregation) || busyArr.includes(el.hierachyBasedAggregation))))
				result = true;
		});

		return result;
	}


	ipamODECtrl.getAgingFlag=function(networkElementList){

		var result = false;

		networkElementList.forEach(networkElement=> {
			if(networkElement.headerList.some(el => el.type === 'kpi' && el.agingFlag))
				result = true;
		});
		return result;
	}


	ipamODECtrl.getConsecutiveFlag=function(networkElementList){

		var result = false;

		networkElementList.forEach(networkElement=> {
			if(networkElement.headerList.some(el => el.type === 'kpi' && el.consecutiveFlag))
				result = true;
		});
		return result;
	}


	ipamODECtrl.getSupportingDashboardFlag=function(networkElementList){

		var result = false;

		networkElementList.forEach(networkElement=> {
			if(networkElement.supportingDashboardFlag)
				result = true;
		});
		return result;
	}


	ipamODECtrl.onDemandExecutionFunction=function(confirm){

		ipamODECtrl.search="";

		var networkElementList = angular.copy(ipamODECtrl.networkElementList);

		if(!networkElementList || networkElementList.length === 0) {
			return;
		}

		if($rootScope.streamingFlag) {
			ATOMService.showMessage('error','WARNING','You have to stop live stream in order to submit new request. ');
			return;
		}

		if(networkElementList.some(networkElement => networkElement.aggregationList.row.some(aggr=> aggr.size > 100000))){
			ATOMService.showMessage('error','Invalid Aggregation Details','Aggregation size value exceeds 100000 limit.');
			return;
		}

		for(var i = 0; i < networkElementList.length; i++) {
			ipamODECtrl.setAttributesForExecution(networkElementList[i], i);
		}

		var jsonDataObj = {
			username: $rootScope.globals.currentUser.username,
			userName: $rootScope.globals.currentUser.username,
			project: $rootScope.project,
			networkElementList: networkElementList,
		}

		if(confirm) {
			ipamODECtrl.executionName = null;
			ipamODECtrl.confirmAction("ODEWithExecutionName", "ON DEMAND EXECUTION", "Are you sure, you want to submit On Demand Execution request?");
			return;
		} else {
			angular.element('#modalForConfirmation').modal('hide');
		}

		ipamODECtrl.clearODEExecutionResult();

		ipamODECtrl.fetchODEResult(jsonDataObj, -1, 'executeAll');
	}


	ipamODECtrl.fetchODEResult=function(finalData, index, event){

		console.log('index value',index);
		var postData = {};
		var queryStringNodeName = "";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"project": $rootScope.project
		};

		if(index < 0) {
			postData = angular.copy(finalData);

			if(ipamODECtrl.isMissingBucketTypeSize(postData.networkElementList))
			{
				ATOMService.showMessage('error','FAILED','Missing bucket type and size in dashboard. Please update dashboard to add bucket details.');
				return;
			}

			var flowId = $rootScope.generateUUID();
			postData.flowId = flowId;
			if(ipamODECtrl.executionName)
				postData.executionName = ipamODECtrl.executionName;

			//prepare data for runtime processing
			ipamODECtrl.finalData = [];
			postData.networkElementList.forEach(ne=> {

				var networkElement = ne;
				networkElement.flowId = flowId;
				if(ipamODECtrl.executionName)
					networkElement.executionName = ipamODECtrl.executionName;

				// set doubleTimeAggFlag by checking applicability
				networkElement.doubleTimeAggFlag = networkElement.headerList.some(el => el.type === 'kpi' && el.isNestedDual);

				if(networkElement.executionMode === 'RealTime' && networkElement.timeSelectionType && ['pastNthDay','customTimeRange'].includes(networkElement.timeSelectionType))
				{
					networkElement.realTimeExecutionWithTimeSelectionFlag = true;
				}

				var finalObj = {
					index: ne.index,
					networkElement: angular.copy(networkElement),
					execObj: null
				}
				ipamODECtrl.finalData.push(finalObj);
			})

			// run real time execution dashboards
			ipamODECtrl.submitForRealTimeRun(ipamODECtrl.finalData.filter(finalObj=> finalObj.networkElement.executionMode === 'RealTime'), 'refreshLiveData-executeAll');

			// only submit Manual execution requests
			postData.networkElementList = postData.networkElementList.filter(ne=> ne.executionMode != 'RealTime');

			if(!postData.networkElementList.length)
				return;

			postData.dashboardDoubleAggregationPresent = ipamODECtrl.getDashboardDoubleAggregationPresentFlag(postData.networkElementList);

			postData.agingFlag = ipamODECtrl.getAgingFlag(postData.networkElementList);
			postData.supportingDashboardFlag = ipamODECtrl.getSupportingDashboardFlag(postData.networkElementList);
			if(ipamODECtrl.getConsecutiveFlag(postData.networkElementList))
				postData.consecutiveFlag = true;
			queryStringNodeName = postData.networkElementList[0].executionType === 'SingleProduct' ? postData.networkElementList[0].nodeName : 'multiProduct';
		}
		else
		{
			// send old execution id and generate new one
			var finalObj = ipamODECtrl.finalData.find(item=> item.index === index);
			finalObj.networkElement.oldExecutionId = finalObj.networkElement.executionId;
			finalObj.networkElement.executionId = (new Date()).getTime() + "";

			// set doubleTimeAggFlag by checking applicability
			finalObj.networkElement.doubleTimeAggFlag = finalObj.networkElement.headerList.some(el => el.type === 'kpi' && el.isNestedDual);

			var networkElement = angular.copy(finalObj.networkElement);

			if(!networkElement.hourList || !networkElement.hourList.length)
				delete networkElement.hourList;

			if(!['refreshLiveData-headerAdd','headerAdd'].includes(event))
				{
					delete networkElement.dynamicHeaderList;
				}

			postData = {
				username: $rootScope.globals.currentUser.username,
				userName: $rootScope.globals.currentUser.username,
				project: $rootScope.project,
				networkElementList: [networkElement],
				dashboardDoubleAggregationPresent: ipamODECtrl.getDashboardDoubleAggregationPresentFlag([networkElement]),
				agingFlag: ipamODECtrl.getAgingFlag([networkElement]),
				supportingDashboardFlag: ipamODECtrl.getSupportingDashboardFlag([networkElement])
			}
			if(ipamODECtrl.getConsecutiveFlag(postData.networkElementList))
				postData.consecutiveFlag = true;

			if(['fetchStatisticalDataOnGoOffline'].includes(event))
			{
				if(postData.dashboardDoubleAggregationPresent)
					postData.flowId = $rootScope.generateUUID();
				else
					postData.flowId = networkElement.flowId;
			}
			else
			{
				postData.flowId = $rootScope.generateUUID();
			}

			console.log('event',event);
			console.log('index',index);
			if(['refreshLiveData-mannually','refreshLiveData-executeAll','refreshLiveData-headerUpdate','refreshLiveData-headerAdd'].includes(event))
			{
				header.requestId = finalObj.requestId;
				postData.refreshLiveDataManually = true;
			}
			if(['refreshLiveData-headerAdd','headerAdd'].includes(event))
				{
					
					postData.flowId=networkElement.flowId;
				}
			console.log('requestId',header.requestId);

			if(networkElement.executionName)
				postData.executionName = networkElement.executionName;

			ipamODECtrl.singleExecFlowId = postData.flowId;
			networkElement.flowId = postData.flowId;

			queryStringNodeName = networkElement.executionType === 'SingleProduct' ? networkElement.nodeName : 'multiProduct';
		}

		if(!postData.networkElementList.length)
			return;

		var queryString = "operation=onDemandCounterExecution" + "&nodeName=" + queryStringNodeName ;

		ATOMCommonServices.commonPostMethod(postData,Constants.IPM_USER_TABULAR_DASHBOARD_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){

					angular.element('#OdeDatelevelFilter').modal('hide');

					if(index < 0) {

						if(response.AppData.appdata.requestType === 'DATA')
						{
							response.AppData.appdata.overAllResult.forEach(execObj=> {

								ipamODECtrl.setExecutionResultTitle(execObj);

								var finalObj = ipamODECtrl.finalData.find(item=> item.index === execObj.index);

								ipamODECtrl.setViewTypeAndSummaryData(finalObj, execObj);
								finalObj.paginationId = "pagination_" + execObj.index;
								finalObj.freezeIndex = execObj.freezeIndex;
								finalObj.showFlag = true;
								finalObj.execObj = execObj;
								
								
							});

							ipamODECtrl.showPanelForExecutionResult = true;

							ATOMService.showMessage('success',"On Demand Execution Results are Ready.");

							$window.scrollTo(0, 0);
							ipamODECtrl.minimizeODEFormPanelAndNavbar();
						}
						else if (response.AppData.appdata.requestType === 'ALERT')
						{
							if(response.AppData.appdata.webSocket === 'ALERT')
							{
								ATOMService.showMessage('success',"Request submitted successfully. You will get the data once results are ready.");
								$rootScope.updateWaitForDataOnSamePageListFn('Add', postData.flowId);
							}
							else
							{
								ATOMService.showMessage('success',"Request submitted successfully. You will get data and a notification once results are ready.");
							}
						}
						else if (response.AppData.appdata.requestType === 'REQUEST_IS_IN_PROGRESS')
						{
							ATOMService.showMessage('success',"Request is already in progress ...");
						}
					}
					else if(index >= 0)
					{
						var finalObj = ipamODECtrl.finalData.find(item=> item.index === index);
						if(event === 'refreshLiveData-mannually')
						{
							ipamODECtrl.startTimer(finalObj);
						}

						finalObj.networkElement.flowId = ipamODECtrl.singleExecFlowId;

						if(response.AppData.appdata.requestType === 'DATA')
						{
							ATOMService.showMessage('success',"On Demand Execution Result is Ready.");
							
							var execObj = response.AppData.appdata.overAllResult[0];
							ipamODECtrl.setViewTypeAndSummaryData(finalObj, execObj);

							finalObj.execObj = execObj;
							finalObj.freezeIndex = response.AppData.appdata.overAllResult[0].freezeIndex;

							ipamODECtrl.setExecutionResultTitle(finalObj.execObj);
							if(finalObj.showFlag){
								finalObj.showFlag = false;
								$timeout(function(){
									finalObj.showFlag = true;
								}, 100);
							}
						}
						else if (response.AppData.appdata.requestType === 'ALERT')
						{
							if(response.AppData.appdata.webSocket === 'ALERT')
							{
								ATOMService.showMessage('success',"Request submitted successfully. You will get the data once results are ready.");
								finalObj.waitForDataOnSamePageflag = true;
							}
							else
							{
								ATOMService.showMessage('success',"Request submitted successfully. You will get data and a notification once results are ready.");
							}
						}
						else if (response.AppData.appdata.requestType === 'REQUEST_IS_IN_PROGRESS')
						{
							ATOMService.showMessage('success',"Request is already in progress ...");
						}

					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to submit Execution Request. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

	}



	ipamODECtrl.isMissingBucketTypeSize=function(neList)
	{
		if(!neList || !neList.length)
			return false;

		return neList.some(ne=> 
			ne.aggregationOperationType === 'timeBasedAggregation'
			&& (!ne.bucketType
				|| (!ne.bucketSize && ne.bucketSize != 0)
			)
		)
	}


	ipamODECtrl.submitForRealTimeRun=function(filteredFinalObjArr, event){

		if(!filteredFinalObjArr.length)
			return;

		ipamODECtrl.showPanelForExecutionResult = true;
		$window.scrollTo(0, 0);
		ipamODECtrl.minimizeODEFormPanelAndNavbar();

		filteredFinalObjArr.forEach(finalObj => {

			var networkElement = finalObj.networkElement;

			if(event === 'refreshLiveData-executeAll')
			{
				var execObj = {reportForText: networkElement.dashboardName};
				execObj.viewType = networkElement.summaryFlag ? 'View Summary' : 'View Details'; 
				if(!execObj.reportForText)
					execObj.reportForText = networkElement.executionType === 'SingleProduct' ? networkElement.nodeName : 'Multi-Product';

				execObj.intervalText = "Live Data";
				execObj.isRealTimeRun = true;
				finalObj.showFlag = true;
				finalObj.execObj = execObj;
			}

			ipamODECtrl.liveMonitoringFunction('GOLIVE', finalObj, event);
		});
	}


	$scope.$on('SparkExecutionDataAlertForODE', function (event, args) {

		$scope.$apply(function() {

			$scope.message = args.message;

			ipamODECtrl.networkElementList = angular.copy($scope.message.guiJSON.networkElementList);

			if(!ipamODECtrl.networkElementList || !ipamODECtrl.networkElementList.length)
				ipamODECtrl.networkElementList = $scope.message.completeJson.networkElementList;

			ipamODECtrl.finalData = [];

			ipamODECtrl.networkElementList.forEach(ne=> {
				var finalObj = {
					index: ne.index,
					networkElement: angular.copy(ne),
					execObj: null
				}
				// finalObj.networkElement.dashboardName = "";
				ipamODECtrl.finalData.push(finalObj);
			});

			if(args.message.type === 'SparkExecutionDataAlert' || args.message.type === 'WebsocketOnDemandCounterExecutionAlert')
			{
				$timeout(function(){
					ATOMService.showMessage('success',"Fetching execution result.");
					ipamODECtrl.fetchAlertResult(args.message);
				}, 1000);
			}
			else if(args.message.type === 'SparkExecutionFailureAlert')
			{
				ATOMService.showMessage('warning',"Execution Failed","Please verify details and try again.");

				$timeout(function(){
					try {
						$('html,body').animate({scrollTop: $('#odeNodeList').offset().top - 200 }, "slow");
					} catch (error) {
						console.error(error);
					}
				},500);
			}
		});

	});


	ipamODECtrl.setViewTypeAndSummaryData=function(finalObj, newExecObj){

		if(finalObj.networkElement.summaryFlag && ipamODECtrl.summaryEnabledRole)
		{
			newExecObj.summaryEnabled = true;
		}

		var oldExecObj = finalObj.execObj;

		if(oldExecObj && oldExecObj.viewType)
		{
			newExecObj.viewType = oldExecObj.viewType;
		}
		else
		{
			newExecObj.viewType = newExecObj.summaryEnabled ? 'View Summary' : 'View Details';
		}
	}


	ipamODECtrl.toggleTableView=function(viewType, finalObj){
		finalObj.execObj.viewType = viewType;
	}


	ipamODECtrl.fetchAlertResult=function(data){

		var queryStringNodeName = ipamODECtrl.finalData[0].networkElement.executionType === 'SingleProduct' ? ipamODECtrl.finalData[0].networkElement.nodeName : 'multiProduct';

		var queryString="operation=onDemandCounterExecution" + "&nodeName=" + queryStringNodeName;

		var header =
		{
			"username":$rootScope.globals.currentUser.username
		};

		ATOMCommonServices.commonPostMethod(data,Constants.IPM_USER_TABULAR_DASHBOARD_CONTEXT,header,queryString).then(
			function successCallback(response){

				if(response.AppData.type == "SUCCESS")
				{

					response.AppData.appdata.overAllResult.forEach(execObj=> {

						ipamODECtrl.setExecutionResultTitle(execObj);

						var finalObj = ipamODECtrl.finalData.find(item=> item.index === execObj.index);

						ipamODECtrl.setViewTypeAndSummaryData(finalObj, execObj);

						finalObj.paginationId = "pagination_" + execObj.index;
						finalObj.freezeIndex = execObj.freezeIndex;
						finalObj.execObj = execObj;
						finalObj.showFlag = true;
					});

					ipamODECtrl.showPanelForExecutionResult = true;

					ATOMService.showMessage('success',"On Demand Execution Results are Ready.");

					$window.scrollTo(0, 0);
					ipamODECtrl.minimizeODEFormPanelAndNavbar();
				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch execution result. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
			});

	}


	// ODE SparkExecutionData::SparkExecutionDataForODE Websocket
	$scope.$on('SparkExecutionDataForODE', function (event, args) {

		if(ipamODECtrl.finalData && ipamODECtrl.finalData.length
			&& args.message.headers.action === "SparkExecutionData"
			&& args.message.headers.username == $rootScope.globals.currentUser.username) {

			var dataDetail = args.message.dataDetails[0];

			// flowId matches and live monitoring check
			if(!ipamODECtrl.finalData.some(finalObj =>
				finalObj.networkElement.flowId === dataDetail.flowId && !finalObj.requestId))
				return;

			if(!dataDetail.overAllResult || !dataDetail.overAllResult.length)
				return;

			$scope.$apply(function() {

				var updatedExecObjCount = 0;

				dataDetail.overAllResult.forEach(execObj=> {

					// flowId match and index match
					var finalObjIndex = ipamODECtrl.finalData.findIndex(finalObj=>
						finalObj.networkElement.flowId === dataDetail.flowId && finalObj.index === execObj.index);

					if(finalObjIndex >= 0)
					{
						updatedExecObjCount++;

						ipamODECtrl.setViewTypeAndSummaryData(ipamODECtrl.finalData[finalObjIndex], execObj);

						var finalObj = ipamODECtrl.finalData[finalObjIndex];
						finalObj.freezeIndex = execObj.freezeIndex;
						finalObj.execObj = execObj;
						finalObj.waitForDataOnSamePageflag = false;
						ipamODECtrl.setExecutionResultTitle(finalObj.execObj);

						if(finalObj.showFlag){
							finalObj.showFlag = false;
							$timeout(function(){
								finalObj.showFlag = true;
							}, 100);
						}
					}
				});

				ipamODECtrl.showPanelForExecutionResult = true;

				if(updatedExecObjCount > 0)
				{
					ATOMService.showMessage('success',"On demand execution results are updated.");
				}

				ipamODECtrl.minimizeODEFormPanelAndNavbar();

			});
		}
	});


	// ODE WebsocketOnDemandCounterExecution Websocket
	$scope.$on('WebsocketOnDemandCounterExecution', function (event, args) {

		if(ipamODECtrl.finalData && ipamODECtrl.finalData.length
			&& args.message.headers.action === "WebsocketOnDemandCounterExecution"
			&& args.message.headers.username == $rootScope.globals.currentUser.username
			&& args.message.outputFormat === 'table') {

			$rootScope.updateWaitForDataOnSamePageListFn('Delete', args.message.headers.flowId);

			// flowId matches
			if(!ipamODECtrl.finalData.some(finalObj =>
				finalObj.networkElement.flowId === args.message.headers.flowId && !finalObj.requestId))
				return;

			if(args.message.isRequestRedirectedToSpark)
			{
				$scope.$apply(function() {
					try{
						var finalDataList = ipamODECtrl.finalData.filter(finalObj=>
							finalObj.networkElement.flowId === args.message.headers.flowId);

						finalDataList.forEach(finalObj=> {
							finalObj.waitForDataOnSamePageflag = false;
						})
					}
					catch(e){
						console.error(e);
					}

					ATOMService.showMessage('success',"Request is in processing stage","You will get the data via notification once results are ready.");
				});
				return;
			}

			if(!args.message.overAllResult || !args.message.overAllResult.length)
				return;

			$scope.$apply(function() {

				var updatedExecObjCount = 0;

				args.message.overAllResult.forEach(execObj=> {

					// flowId match and index match
					var finalObjIndex = ipamODECtrl.finalData.findIndex(finalObj=>
						finalObj.networkElement.flowId === args.message.headers.flowId && finalObj.index === execObj.index);

					if(finalObjIndex >= 0)
					{
						updatedExecObjCount++;

						ipamODECtrl.setViewTypeAndSummaryData(ipamODECtrl.finalData[finalObjIndex], execObj);

						var finalObj = ipamODECtrl.finalData[finalObjIndex];
						finalObj.freezeIndex = execObj.freezeIndex;
						finalObj.execObj = execObj;
						finalObj.showFlag = true;
						finalObj.waitForDataOnSamePageflag = false;
						ipamODECtrl.setExecutionResultTitle(finalObj.execObj);

						if(finalObj.showFlag){
							finalObj.showFlag = false;
							$timeout(function(){
								finalObj.showFlag = true;
							}, 100);
						}
					}
				});

				ipamODECtrl.showPanelForExecutionResult = true;

				if(updatedExecObjCount > 0)
				{
					ATOMService.showMessage('success',"On demand execution results are updated.");
				}

				ipamODECtrl.minimizeODEFormPanelAndNavbar();

			});
		}
	});


	ipamODECtrl.setExecutionResultTitle=function(execObj){

		if(!execObj || !execObj.nodeName)
			return;

		try{
			if(execObj.tabularResult.breachDetail)
			{
				execObj.tabularResult.breachDetail.hasBreaches = execObj.tabularResult.breachDetail['total Anomalies'] > 0;
			}
		}
		catch(e)
		{
			console.error(e);
		}

		if(execObj.nodeName.includes(" Between "))
		{
			var lastIndex = execObj.nodeName.lastIndexOf(" Between ");

			execObj.reportForText = execObj.nodeName.substring(0, lastIndex);
			execObj.intervalText = execObj.nodeName.substring(lastIndex).replace(" Between ","");
		}
		else if(execObj.nodeName.includes(" for selective dates "))
		{
			var lastIndex = execObj.nodeName.lastIndexOf(" for selective dates ");

			execObj.reportForText = execObj.nodeName.substring(0, lastIndex);
			execObj.intervalText = execObj.nodeName.substring(lastIndex).replace(" for selective dates ","Selective dates ");
		}
	}


	ipamODECtrl.setAttributesForExecution=function(networkElement, i){

		networkElement.index = i;
		networkElement.executionId = (new Date()).getTime() + "";

		if(!networkElement.counter && networkElement.counter !== 0)
			networkElement.counter = 4;

		if( networkElement.timeSelectionType === 'timeInterval' && (!networkElement.startTime || !networkElement.endTime ))
		{
			// set time yesterday-today current time
			networkElement.startTime = moment().subtract(1, 'days').format("YYYY-MM-DD-HH:mm:ss");
			networkElement.endTime = moment().format("YYYY-MM-DD-HH:mm:ss");
		}

		delete networkElement.assigneduser;
		delete networkElement.accessData;
		delete networkElement.userTag;
		delete networkElement.permission;

		networkElement.fiveMinuteFlag = ipamODECtrl.setupBasedBucketSizeList.includes(5);

		// prepare aggregation data for submission
		if(networkElement.aggregationList && networkElement.aggregationList.row && networkElement.aggregationList.row.length)
		{
			networkElement.aggregationList.row.forEach(aggr=> ipamODECtrl.prepareAndSyncSpecificList(aggr, true));
		}
	}


	ipamODECtrl.showHideNECreation=function(){
		$timeout(function(){
			if (document.fullscreenElement && ['ode-drawer-page','ode-resultwrapper'].some(el => document.fullscreenElement.id.includes(el)))
				ipamODECtrl.showNECreationPanel = false;
			else
				ipamODECtrl.showNECreationPanel = true;
		},50);
	}


	ipamODECtrl.toggleDrawerPageFullScreen=function(){

		if (!document.fullscreenElement || (document.fullscreenElement && document.fullscreenElement.id != 'ode-drawer-page')) {
			var element = document.querySelector('#ode-drawer-page');
			element.requestFullscreen().catch(err => {
				console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
			});
		} else {
			document.exitFullscreen();
		}
	}


	ipamODECtrl.toggleDivFullScreen=function(finalObj){

		if (!document.fullscreenElement || (document.fullscreenElement && document.fullscreenElement.id != ('ode-resultwrapper-' + finalObj.index))) {
			var element = document.querySelector('#ode-resultwrapper-' + finalObj.index);
			element.requestFullscreen().catch(err => {
				console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
			});
		} else {
			document.exitFullscreen();
		}
	}


	document.addEventListener('fullscreenchange', ipamODECtrl.showHideNECreation);


	ipamODECtrl.minimizeODEFormPanelAndNavbar=function(){

		try{

			$('.panel-collapse.in').collapse('hide');

			if(!document.body.classList.contains("mini-navbar")) {
				document.body.classList.add("mini-navbar");
				$rootScope.$broadcast('minimizeNavBar', { message: 'Minimize' });
			}

			document.getElementById("navBarRight").style.position = "relative";
			document.getElementById("navBarRight").style.left = "10%";
		} catch (e){
			console.error(e);
		}
	}


	ipamODECtrl.sortDataList=function(field,reverseSort,finalObj){

		$timeout(function(){
			try {
				angular.element('#loadingModal').modal('show');
			} catch (error) {
				console.error(error);
			}
		},100);

		var execObj = finalObj.execObj;

		if(execObj.dataFilter)
			execObj.dataFilter.appliedFlag = false;

		if(field && field === execObj.orderByField && reverseSort === ''){
			execObj.orderByField = -1;
			execObj.reverseSort = false;
			if(execObj.unmutableData){
				execObj.tabularResult.data = angular.copy(execObj.unmutableData);
				$timeout(function(){
					try {
						angular.element('#loadingModal').modal('hide');
					} catch (error) {
						console.error(error);
					}
				},1500);

			return
			}
		}
		else if(field)
		{
			execObj.orderByField = field;
			execObj.reverseSort = reverseSort;
		}
		else
		{
			if(execObj.unmutableData){
				execObj.tabularResult.data = execObj.unmutableData;
				$timeout(function(){
					try {
						angular.element('#loadingModal').modal('hide');
					} catch (error) {
						console.error(error);
					}
				},1500);

			return;
			}
		}

		//sort data
		if(!execObj.unmutableData)
			execObj.unmutableData = angular.copy(execObj.tabularResult.data);
		else
			execObj.tabularResult.data = angular.copy(execObj.unmutableData);


		if(execObj.orderByField >= 0){
			ipamODECtrl.sortingFunction(execObj);
		}

	}


	ipamODECtrl.sortingFunction=function(execObj){

		execObj.tabularResult.data = execObj.tabularResult.data.sort(function(a,b){

			var prop1 = a['fieldValue_'+execObj.orderByField].split('#_#')[0];
			var prop2 = b['fieldValue_'+execObj.orderByField].split('#_#')[0];

			prop1 = ipamODECtrl.stringToNumber(prop1);
			prop2 = ipamODECtrl.stringToNumber(prop2);

			if(execObj.reverseSort)
				return prop2 - prop1;
			else
				return prop1 - prop2;
		});
		$timeout(function(){
			try {
				angular.element('#loadingModal').modal('hide');
			} catch (error) {
				console.error(error);
			}
		},1500);
	}


	ipamODECtrl.MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER + 1;
	ipamODECtrl.MIN_SAFE_INTEGER_LESS_ONE = Number.MIN_SAFE_INTEGER + 2;


	ipamODECtrl.stringToNumber=function(value){

		if(value === 'NA')
			return ipamODECtrl.MIN_SAFE_INTEGER;
		else if(value === 'NaN')
			return ipamODECtrl.MIN_SAFE_INTEGER_LESS_ONE;
		else
			return Number(value);
	}


	ipamODECtrl.statisticalDataFunction=function(action, headerPosition, finalObj){

		if(action === 'AddOrRemove') {

			if(!headerPosition && !finalObj && finalObj.execObj.tabularResult.data
				&& finalObj.execObj.tabularResult.data.length)
			{
				return;
			}

			var execObj = finalObj.execObj;
			var networkElement = finalObj.networkElement;
			var headerName = execObj.tabularResult.tableHeaderList[headerPosition];

			if(execObj.statObject && execObj.statObject.data)
			{
				var exisingIndex = execObj.statObject.headerArr.findIndex(el=> el === headerName);
				if(exisingIndex == -1)
				{
					execObj.statObject.headerArr.push(headerName);
				}
				else
				{
					execObj.statObject.headerArr.splice(exisingIndex,1);
				}

				ipamODECtrl.statisticalDataFunction('fillStatisticalData',-1,finalObj);
			}
			else
			{
				execObj.statObject = ipamODECtrl.statisticalDataFunction('resetObj');
				execObj.statObject.headerArr.push(headerName);
				ipamODECtrl.statisticalDataFunction('fetchStatisticalData',-1,finalObj);
			}
		}
		else if(action === 'resetObj') {
			return {
				headerArr: [],
				data: [],
				tableHeaderData: [],
				tableRowData: [],
				showStatTableFlag: false
			};
		}
		else if(action === 'fetchStatisticalData')
		{

			var execObj = finalObj.execObj;

			var queryString = "operation=applyFilters";

			var postData = {
				executionId: finalObj.networkElement.executionId,
				tableHeaderList: [],
				
			}
			if(execObj.tabularResult.headerNameExecutionIdList){
				postData.headerNameExecutionIdList=execObj.tabularResult.headerNameExecutionIdList;
			}

			execObj.tabularResult.tableHeaderList.forEach((el,i)=> {

				if(i >= execObj.freezeIndex)
					postData.tableHeaderList.push(el);
			});

			var header = {
				"username": $rootScope.globals.currentUser.username,
				"project": $rootScope.project
			};

			ATOMCommonServices.commonPostMethod(postData,Constants.IPM_USER_TABULAR_DASHBOARD_CONTEXT,header,queryString).then(
				function successCallback(response){

					if( response.AppData.type == "SUCCESS")
					{
						execObj.statObject.data = response.AppData.appdata;
						ipamODECtrl.statisticalDataFunction('fillStatisticalData',-1,finalObj);
					}
					else
					{
						ATOMService.showMessage('error','WARNING','Unable to fetch Statistical Data Request. Please contact admin. ');
					}
				},
				function errorCallback(responseData){
					ATOMService.showMessage('error','ERROR','server is not reachable');
			});
		}
		else if(action === 'fillStatisticalData')
		{

			var execObj = finalObj.execObj;

			if(!execObj.statObject.headerArr.length)
			{
				execObj.statObject.showStatTableFlag = false;
				return;
			}

			if(!execObj.statObject.data || angular.equals({}, execObj.statObject.data))
			{
				ATOMService.showMessage('error','WARNING','No Statistical Data found. ');
				execObj.statObject.showStatTableFlag = false;
				return;
			}

			var tableHeaderData = execObj.statObject.tableHeaderData;
			var tableRowData = execObj.statObject.tableRowData;

			tableHeaderData = ['Operation'];
			tableRowData = [];

			tableHeaderData = tableHeaderData.concat(execObj.statObject.headerArr);
			//execObj.statObject.headerArr.forEach(header=> { tableHeaderData.push(header); });

			var statisticsOperationList = ['count','sum','min','max','average','standard_deviation','variance'];

			statisticsOperationList.forEach(operation=>{

				var opObj = execObj.statObject.data[operation];

				if(!opObj || angular.equals({}, opObj))
					return;

				var dataArr = [];

				tableHeaderData.forEach((header,index)=> {

					if(index === 0)
						dataArr.push(operation.toUpperCase());
					else
						dataArr.push(opObj[header]);
				});

				tableRowData.push(dataArr);
			})

			execObj.statObject.tableHeaderData = tableHeaderData;
			execObj.statObject.tableRowData = tableRowData;
			execObj.statObject.showStatTableFlag = true;
			if(tableHeaderData.length === 2)
				ATOMService.showMessage('success',"","Statistical Data fetched sucessfully.");
			else
				ATOMService.showMessage('success',"","Statistical Data updated sucessfully.");
		}

	}


	ipamODECtrl.dynamicFilterChangeFn=function(action, data, index){

		if(action === 'openModal')
		{
			var finalObj = ipamODECtrl.finalData.find(item=> item.index === index);
			var networkElement = angular.copy(finalObj.networkElement);
			ipamODECtrl.df = {};
			ipamODECtrl.df.index = index;
			ipamODECtrl.df.ne = angular.copy(networkElement);
			ipamODECtrl.df.fieldData = networkElement.fieldData;

			if(ipamODECtrl.df.fieldData && ipamODECtrl.df.fieldData.length)
			{
				ipamODECtrl.df.dynamicRawCategoryViewList = [];
				ipamODECtrl.df.dynamicFiltersFlag = true;

				if(ipamODECtrl.df.ne.aggregationOn === 'RAW')
					ipamODECtrl.fetchCategoryListForDFChange();

				try {
					ipamODECtrl.dynamicFilterEditFetchFlag = true;
					var notSpecificIndex = ipamODECtrl.df.fieldData.findIndex(el => !el.isCategorySpecific);
					if(notSpecificIndex != -1)
						ipamODECtrl.fetchFieldNameListForDFChange(notSpecificIndex);
				}
				catch(error) { console.error(error); }
				finally {
					ipamODECtrl.dynamicFilterEditFetchFlag = false;
				}

				ipamODECtrl.df.fieldData.forEach((el,index)=>{
					if(ipamODECtrl.df.ne.aggregationOn === 'RAW' && el.isCategorySpecific)
					{
						ipamODECtrl.fetchRAWFieldNameListForDFChange(index);
					}

					// convert string to date
					if((el.queryType === 'Range' || el.subQueryType === 'Range') && el.typeRange === 'Date')
					{
						el.value.startDate = new Date(el.value.startDate);
						el.value.endDate = new Date(el.value.endDate);
					}
				});
			}
			else
			{
				ipamODECtrl.dynamicFilterChangeFn('resetData');
			}
			$timeout(function(){
				angular.element('#modalForDynamicFilterChange').modal('show');
			},200);
		}
		else if(action === 'resetData')
		{

			ipamODECtrl.df.dynamicFiltersFlag = true;

			ipamODECtrl.df.dynamicRawCategoryViewList = [];

			ipamODECtrl.df.fieldData = [{
				category: "",
				queryType: null,
				clause: null,
				subQueryType: null,
				fieldName: null,
				value: null,
				typeRange: null,

				isCategorySpecific: false,
				dynamicFieldViewList: [],
				termsValueFlag: false
			}];

			ipamODECtrl.fetchFieldNameListForDFChange(0);
		}
		else if(action === 'addMoreFields')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterChangeFn', ipamODECtrl.df.fieldData);
		}
		else if(action === 'addMoreTermValue')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterChangeFn', ipamODECtrl.df.fieldData);
		}
		else if(action === 'delete')
		{
			if(ipamODECtrl.df.fieldData.length === 1)
			{
				ipamODECtrl.dynamicFilterChangeFn('resetData')
			}
			else
			{
				ipamODECtrl.df.fieldData.splice(index,1);
			}
		}
		else if(action === 'resetForm')
		{
			ipamODECtrl.dynamicFilterChangeFn('resetData')
		}
		else if(action === 'categoryFlagChange')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterChangeFn', ipamODECtrl.df.fieldData);
		}
		else if(action === 'categoryChange')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterChangeFn', ipamODECtrl.df.fieldData);
		}
		else if(action === 'queryTypeChange')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterChangeFn', ipamODECtrl.df.fieldData);
		}
		else if(action === 'typeRangeChange')
		{
			ipamODECtrl.dynamicFilterCommonFn(action, data, index, 'dynamicFilterChangeFn', ipamODECtrl.df.fieldData);
		}
		else if(action === 'apply')
		{
			if($scope.odedynamicfilterchangeform.$invalid)
			{
				ATOMService.showMessage('error','ERROR','Please add valid filter values. ');
				return;
			}
			else if(!ipamODECtrl.df.fieldData.length)
			{
				ATOMService.showMessage('error','ERROR','Please add minimum one filter. ');
				return;
			}

			var fieldData = ipamODECtrl.prepareDynamicFieldData(angular.copy(ipamODECtrl.df.fieldData));

			var finalObj = ipamODECtrl.finalData.find(item=> item.index === ipamODECtrl.df.index);
			finalObj.networkElement.fieldData = fieldData;

			ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, ipamODECtrl.df.index, 'dynamicFilterChange');

			angular.element('#modalForDynamicFilterChange').modal('hide');
		}
		else if(action === 'removeFilters')
		{
			var finalObj = ipamODECtrl.finalData.find(item=> item.index === ipamODECtrl.df.index);
			delete finalObj.networkElement.fieldData;

			ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, ipamODECtrl.df.index, 'dynamicFilterChange');

			angular.element('#modalForDynamicFilterChange').modal('hide');
		}
	}


	ipamODECtrl.fetchFieldNameListForDFChange=function(index){

		var obj = ipamODECtrl.df.fieldData[index];

		var dynamicFilterEditFetchFlag = ipamODECtrl.dynamicFilterEditFetchFlag;

		obj.dynamicFieldViewList = [];

		if((ipamODECtrl.df.ne.aggregationOn != 'HNA' && !ipamODECtrl.df.ne.nodeName) || !ipamODECtrl.df.ne.aggregationOn)
			return;

		var queryString = "operation=getAggregationFieldNameListForDynamicFilter";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"aggregationOn": ipamODECtrl.df.ne.aggregationOn
		};

		if(ipamODECtrl.df.ne.aggregationOn != 'HNA')
		{
			header.nodeName = ipamODECtrl.df.ne.nodeName;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(

			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					obj.dynamicFieldViewList = response.AppData.appdata.resultList;

					if(!obj.dynamicFieldViewList || obj.dynamicFieldViewList.length === 0)
					{
						ATOMService.showMessage('error','WARNING','Field Name List is Empty. ');
					}
					else {

						if(dynamicFilterEditFetchFlag) {
							ipamODECtrl.df.fieldData.forEach((el,i)=>{
								if(!el.isCategorySpecific)
								{
									el.dynamicFieldViewList = angular.copy(obj.dynamicFieldViewList);
								}
							});
						}
					}
				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch Field Name List. Please contact admin. ');
				}
			},
			function errorCallback(responseData) {
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

	}

	ipamODECtrl.fetchCategoryListForDFChange=function(){

		if(ipamODECtrl.df.ne.aggregationOn != 'RAW')
			return;

		if(!ipamODECtrl.df.ne.nodeName)
			return;

		var queryString="operation=getCounterCategoryList";

		var header= {
			"username":$rootScope.globals.currentUser.username,
			"nodeName": ipamODECtrl.df.ne.nodeName
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT, header, queryString).then(
			function successCallback(response) {
				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.df.dynamicRawCategoryViewList = response.AppData.appdata.resultList;
					if(ipamODECtrl.df.dynamicRawCategoryViewList.length === 0) {
						ATOMService.showMessage('error','WARNING','Category List is empty ');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Category List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.fetchRAWFieldNameListForDFChange=function(index){

		var obj = ipamODECtrl.df.fieldData[index];

		if(!ipamODECtrl.df.ne.nodeName || !obj.category)
			return;

		var queryString="operation=getCnaCommonFieldNamesWithType";

		var header = {
			"X-Flow-Id" : Date.now(),
			"username":$rootScope.globals.currentUser.username
		};

		var finalObject = {
			"nodeName": ipamODECtrl.df.ne.nodeName,
			"isCategorySpecific": obj.isCategorySpecific ? 'true' : 'false',
			"categoryList": [obj.category]
		}

		ATOMCommonServices.commonPostMethod(finalObject,Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){
				if( response.AppData.type == "SUCCESS"){

					obj.dynamicFieldViewList = response.AppData.appdata.resultList;

					if(obj.dynamicFieldViewList.length==0){
						ATOMService.showMessage('error','ERROR','Field Name List is empty. ');
					}
				}
				else {
					ATOMService.showMessage('error','ERROR','Unable to fetch Field Name List. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.filterTableData=function(action, field, finalObj){

		if(action === 'openModal') {

			if(!field || (!finalObj && index != 0)){

				return;
			}

			if($scope.odedatafilterform) {
				$scope.odedatafilterform.$setUntouched();
				$scope.odedatafilterform.$setPristine();
			}

			var execObj = finalObj.execObj;

			if(execObj.dataFilter && execObj.dataFilter.appliedFlag && execObj.dataFilter.field === field)
			{
				ipamODECtrl.dataFilter = angular.copy(execObj.dataFilter);
			}
			else
			{
				ipamODECtrl.filterTableData('resetObj');
				ipamODECtrl.dataFilter.index = finalObj.index;
				ipamODECtrl.dataFilter.field = field;
				ipamODECtrl.dataFilter.header = execObj.tabularResult.tableHeaderList[field-1];
			}

			angular.element('#modalForDataFilter').modal('show');
		}
		else if(action === 'resetObj') {
			ipamODECtrl.dataFilter = {
				index: -1,
				field: "",
				header: "",
				operation: "",
				value: "",
				reverseSort: null,
				appliedFlag: false,
				operationList: ['<','<=','=','!=','>=','>']
			};
		}
		else if(action === 'apply')
		{

			$timeout(function(){
				try {
					angular.element('#loadingModal').modal('show');
				} catch (error) {
					console.error(error);
				}
			},100);

			var finalObj = ipamODECtrl.finalData.find(item=> item.index === ipamODECtrl.dataFilter.index);
			var execObj = finalObj.execObj;

			execObj.dataFilter = angular.copy(ipamODECtrl.dataFilter);
			execObj.dataFilter.appliedFlag = true;

			if(!execObj.unmutableData)
				execObj.unmutableData = angular.copy(execObj.tabularResult.data);
			else
				execObj.tabularResult.data = angular.copy(execObj.unmutableData);

			// filtering
			execObj.tabularResult.data = execObj.tabularResult.data.filter(el=> {

				var currentValue = el['fieldValue_'+ipamODECtrl.dataFilter.field].split('#_#')[0];
				currentValue = ipamODECtrl.stringToNumber(currentValue);

				switch(ipamODECtrl.dataFilter.operation) {
					case '<':
						return currentValue < ipamODECtrl.dataFilter.value;
					case '<=':
						return currentValue <= ipamODECtrl.dataFilter.value;
					case '=':
						return currentValue === ipamODECtrl.dataFilter.value;
					case '!=':
						return currentValue != ipamODECtrl.dataFilter.value;
					case '>=':
						return currentValue >= ipamODECtrl.dataFilter.value;
					case '>':
						return currentValue > ipamODECtrl.dataFilter.value;
				};
			});

			// sorting
			if(ipamODECtrl.dataFilter.reverseSort === true || ipamODECtrl.dataFilter.reverseSort === false) {
				execObj.orderByField = ipamODECtrl.dataFilter.field;
				execObj.reverseSort = ipamODECtrl.dataFilter.reverseSort;
				ipamODECtrl.sortingFunction(execObj);
			}
			else
			{
				execObj.orderByField = -1;
				execObj.reverseSort = null;
			}
			$timeout(function(){
				try {
					angular.element('#loadingModal').modal('hide');
				} catch (error) {
					console.error(error);
				}
			},1500);
			angular.element('#modalForDataFilter').modal('hide');
		}
		else if(action === 'resetForm')
		{
			ipamODECtrl.dataFilter.operation = "";
			ipamODECtrl.dataFilter.value = "";
			ipamODECtrl.dataFilter.reverseSort = null;

			if($scope.odedatafilterform) {
				$scope.odedatafilterform.$setUntouched();
				$scope.odedatafilterform.$setPristine();
			}
		}
		else if(action === 'remove')
		{
			var finalObj = ipamODECtrl.finalData.find(item=> item.index === ipamODECtrl.dataFilter.index);
			var execObj = finalObj.execObj;

			if(execObj.unmutableData)
				execObj.tabularResult.data = execObj.unmutableData;

			execObj.orderByField = -1;
			execObj.reverseSort = false;

			ipamODECtrl.filterTableData('resetObj');

			delete execObj.dataFilter;

			angular.element('#modalForDataFilter').modal('hide');
		}
	}


	ipamODECtrl.liveMonitoringFunction=function(action, finalObj, event='singleLive'){

		var liveFlag = false;
		var requestId = "";

		if(action === 'GOLIVE') {

			liveFlag = true;
			if(event === 'refreshLiveData-headerUpdate' || event === 'refreshLiveData-headerAdd')
			{
				requestId = finalObj.requestId;
			}
			else
			{
				requestId = (new Date()).getTime() + "";
			}

			try {
				delete finalObj.networkElement.startTime;
				delete finalObj.networkElement.endTime;

				$('#datetimepickerodeend').data("DateTimePicker").clear();
				$('#datetimepickerodestart').data("DateTimePicker").clear();
			} catch (e) {
			}

			if(finalObj.networkElement.timeSelectionType && ['pastNthDay','customTimeRange'].includes(finalObj.networkElement.timeSelectionType))
			{
				finalObj.networkElement.realTimeExecutionWithTimeSelectionFlag = true;
			}

		}
		else if(action === 'GOOFFLINE') {

			liveFlag = false;
			requestId = finalObj.requestId;
		}


		if(!requestId || (finalObj.networkElement.executionType === 'SingleProduct' && !finalObj.networkElement.nodeName))
		{
			return;
		}

		var queryString = "operation=LiveOnDemandCounterExecution";

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"requestId": requestId,
			"liveFlag": liveFlag,
			"project": $rootScope.project
		};


		var postData = {
			username: $rootScope.globals.currentUser.username,
			userName: $rootScope.globals.currentUser.username,
			project: $rootScope.project,
			networkElementList: [finalObj.networkElement],
			flowId: finalObj.networkElement.flowId,
			dashboardDoubleAggregationPresent: ipamODECtrl.getDashboardDoubleAggregationPresentFlag([finalObj.networkElement]),
			agingFlag: ipamODECtrl.getAgingFlag([finalObj.networkElement]),
			supportingDashboardFlag: ipamODECtrl.getSupportingDashboardFlag([finalObj.networkElement])
		}

		if(ipamODECtrl.getConsecutiveFlag(postData.networkElementList))
			postData.consecutiveFlag = true;

		if(finalObj.networkElement.executionType === 'SingleProduct') 
		{
			header.nodeName = finalObj.networkElement.nodeName;
		}
		else if(finalObj.networkElement.executionType === 'MultipleProduct')
		{
			header.nodeName = finalObj.networkElement.headerList[0].nodeName;
		}


		ATOMCommonServices.commonPostMethod(postData,Constants.IPM_USER_TABULAR_DASHBOARD_CONTEXT,header,queryString).then(

			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					if(liveFlag) {
						$rootScope.showLiveButton = true;
						$rootScope.streamingFlag = true;

						finalObj.requestId = requestId;
						finalObj.enableRefreshManuallyBtnWhileLiveFlag = true;

						if(event === 'singleLive')
						{
							ATOMService.showMessage('success','SUCCESS','Live Monitoring Started. ');
						}

						if(event === 'refreshLiveData-executeAll' || event === 'refreshLiveData-headerUpdate' || event === 'refreshLiveData-headerAdd')
						{
							ipamODECtrl.refreshLiveDataManually(finalObj, event);
						}

						// hide min max statistical data table
						if(finalObj.networkElement.totalExecFlag && finalObj.execObj && finalObj.execObj.statObject)
							finalObj.execObj.statObject.showStatTableFlag = false;
					}
					else {

						delete finalObj.requestId;
						ipamODECtrl.stopTimer(finalObj);
						delete finalObj.enableRefreshManuallyBtnWhileLiveFlag;
						finalObj.waitForDataOnSamePageflag = false;

						ATOMService.showMessage('success','SUCCESS','Live Monitoring Stopped Successfully. ');

						var isAnyLiveRequest = false;

						for(var i = 0; i < ipamODECtrl.finalData.length; i++) {
							if(ipamODECtrl.finalData[i].requestId) {
								isAnyLiveRequest = true;
								break;
							}
						}

						$rootScope.showLiveButton = isAnyLiveRequest;
						$rootScope.streamingFlag = isAnyLiveRequest;

						delete finalObj.networkElement.realTimeExecutionWithTimeSelectionFlag;

						// fetch ode results again to update min max statistical data
						if(!ipamODECtrl.isReadOnlyRole)
						{
							finalObj.networkElement.executionMode = 'Manual';

							if(finalObj.networkElement.totalExecFlag)
								ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, finalObj.index, 'fetchStatisticalDataOnGoOffline');
							else if(finalObj.execObj && finalObj.execObj.isRealTimeRun)
								ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, finalObj.index, '');
						}
						else if(ipamODECtrl.isReadOnlyRole)
						{
							if(finalObj.networkElement.executionMode === 'Manual')
							{
								if(finalObj.networkElement.totalExecFlag)
									ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, finalObj.index, 'fetchStatisticalDataOnGoOffline');
								else if(finalObj.execObj && finalObj.execObj.isRealTimeRun)
									ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, finalObj.index, '');
							}
							else if(finalObj.networkElement.executionMode === 'RealTime')
							{
								if(ipamODECtrl.finalData.length === 1)
								{
									ipamODECtrl.clearODEExecutionResult();
									window.scrollTo(0,0);
								}
								else
								{
									var index = ipamODECtrl.finalData.findIndex(el=> el === finalObj);
									ipamODECtrl.finalData.splice(index,1);
								}
							}
						}
					}
				}
				else
				{
					if(liveFlag)
						ATOMService.showMessage('error','WARNING','Unable to Start Live Monitoring. Please contact admin. ');
					else
						ATOMService.showMessage('error','WARNING','Unable to Stop Live Monitoring. Please contact admin. ');
				}
			},
			function errorCallback(responseData) {
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	// ODE Live Data Websocket
	$scope.$on('LiveOnDemandCounterExecution', function (event, args) {

		if(ipamODECtrl.finalData && args.message.headers.action === "LiveOnDemandCounterExecution" && args.message.headers.username == $rootScope.globals.currentUser.username) {

			$scope.$apply(function() {

				var finalObj = ipamODECtrl.finalData.find(finalObj => finalObj.requestId === args.message.headers.requestId);

				if(finalObj)
				{
					var execObj = args.message.overAllResult[0];

					ipamODECtrl.setViewTypeAndSummaryData(finalObj, execObj);

					finalObj.execObj = execObj;
					finalObj.freezeIndex = finalObj.execObj.freezeIndex;
					ipamODECtrl.setExecutionResultTitle(finalObj.execObj);
					finalObj.waitForDataOnSamePageflag = false;

					if(finalObj.showFlag){
						finalObj.showFlag = false;
						$timeout(function(){
							finalObj.showFlag = true;
						}, 100);
					}
				}

			});
		}
	});


	ipamODECtrl.startTimer=function(finalObj){

		finalObj.enableRefreshManuallyBtnWhileLiveFlag = false;
		if(finalObj.timer)
			return;

		finalObj.timerValue = 300; // 300 seconds = 5 minutes
		finalObj.timer = $interval(function() {
			if (finalObj.timerValue > 0)
				finalObj.timerValue--;
			else
				ipamODECtrl.stopTimer(finalObj);
		}, 1000);
	}


	ipamODECtrl.stopTimer=function(finalObj){
		finalObj.timerValue = 0;
		finalObj.enableRefreshManuallyBtnWhileLiveFlag = true;

		if (angular.isDefined(finalObj.timer)) {
			$interval.cancel(finalObj.timer);
			finalObj.timer = undefined;
		}
	}

	ipamODECtrl.toggleExecutionResultPanel=function(index) {

		if(document.getElementById('ode-result-toggle-btn-' + index).style.transform) {
			document.getElementById('ode-result-' + index).style.display = "none";
			document.getElementById('ode-result-toggle-btn-' + index).style.transform = "";
		} else {
			document.getElementById('ode-result-' + index).style.display = "block";
			document.getElementById('ode-result-toggle-btn-' + index).style.transform = "rotate(90deg)";
		}
	}


	ipamODECtrl.zoomChangeForODE=function(type,finalObj) {

		if(type === 'increment')
		{
			if(finalObj.networkElement.counter >= 8)
			{
				ATOMService.showMessage('error','ERROR','Maximim Limit Reached. ');
				return;
			}
			else
			{
				finalObj.networkElement.counter++;
			}

			if(finalObj.networkElement.counter === 3 || finalObj.networkElement.counter === 7)
				finalObj.networkElement.counter += 1;
		}
		else if(type === 'decrement')
		{
			if(finalObj.networkElement.counter === 1 && !ipamODECtrl.setupBasedBucketSizeList.includes(5))
            {
                ATOMService.showMessage('error','ERROR','Minimum Limit Reached. ');
                return;
            }
			else if(finalObj.networkElement.counter === 0)
			{
				ATOMService.showMessage('error','ERROR','Minimum Limit Reached. ');
				return;
			}
			else
			{
				finalObj.networkElement.counter--;
			}

			if(finalObj.networkElement.counter === 3 || finalObj.networkElement.counter === 7)
				finalObj.networkElement.counter -= 1;
		}

		// set bucket type and size
		ipamODECtrl.getBucketValueUsingCounter(finalObj.networkElement.counter, finalObj.networkElement);

		ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, finalObj.index, 'counterChange');
	}


	ipamODECtrl.refreshLiveDataManually=function(finalObj, event) {

		ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, finalObj.index, event);
	}


	ipamODECtrl.dateFilterForODE=function(action, finalObj){

		if(action === 'openModal') {
			ipamODECtrl.filterObj.index = finalObj.index;
			var networkElement = finalObj.networkElement;
			ipamODECtrl.filterObj.networkElement = angular.copy(networkElement);

			// filter attribute section
			if(ipamODECtrl.filterObj.networkElement.attributesFlag)
			{

				ipamODECtrl.filterObj.attributes = ipamODECtrl.filterObj.networkElement.attributes;
				if(!ipamODECtrl.filterObj.attributes || !ipamODECtrl.filterObj.attributes.length)
					ipamODECtrl.filterObj.attributes = [];

				ipamODECtrl.filterObj.attributeFilterFlag = ipamODECtrl.filterObj.attributes.some(el=> el.values && !!el.values.length);

				if(ipamODECtrl.filterObj.attributeFilterFlag)
				{
					ipamODECtrl.filterObj.attributes.forEach(el=> {

						var values = angular.copy(el.values);

						$timeout(function(){
							el.values = values;
						}, 500);

						ipamODECtrl.fillAttributeValueDFList(el);
					});
				}
			}

			ipamODECtrl.filterObj.timeSelectionType = ipamODECtrl.filterObj.networkElement.timeSelectionType;

			if(!ipamODECtrl.filterObj.timeSelectionType)
			{
				if(ipamODECtrl.filterObj.networkElement.aggregationOperationType === 'timeBasedAggregation')
					ipamODECtrl.filterObj.timeSelectionType = 'TimeBuckets';
				else
					ipamODECtrl.filterObj.timeSelectionType = '';
			}

			ipamODECtrl.filterObj.bucketType = networkElement.bucketType;
			ipamODECtrl.filterObj.bucketSize = networkElement.bucketSize;

			ipamODECtrl.filterObj.bucketSizeList = [];

			if(['Minutes'].includes(ipamODECtrl.filterObj.bucketType))
			{
				ipamODECtrl.filterObj.bucketSizeList = angular.copy(ipamODECtrl.setupBasedBucketSizeList);
				ipamODECtrl.filterObj.quarterComboList = ipamODECtrl._.range(0,59,networkElement.bucketSize);
			}
			else if(['Hours'].includes(ipamODECtrl.filterObj.bucketType))
			{
				ipamODECtrl.filterObj.bucketSizeList = [1];
				ipamODECtrl.filterObj.quarterComboList = ipamODECtrl._.range(0,59,15);
			}
			else if(ipamODECtrl.filterObj.bucketType)
			{
				ipamODECtrl.filterObj.bucketSizeList = [1];
			}

			ipamODECtrl.filterObj.hourList = networkElement.hourList ? networkElement.hourList : [];
			ipamODECtrl.filterObj.numberOfBucket = networkElement.numberOfBucket;

			ipamODECtrl.filterObj.hourInput = [];
			ipamODECtrl.filterObj.quarterInput = [];

			ipamODECtrl.filterObj.selectiveDatesModel ="";
			ipamODECtrl.filterObj.selectiveDates = networkElement.selectiveDates ? networkElement.selectiveDates : [];

			if(ipamODECtrl.filterObj.timeSelectionType === 'pastNthDay')
			{
				ipamODECtrl.filterObj.networkDayDiff = networkElement.networkDayDiff;
			}
			else
			{
				ipamODECtrl.filterObj.networkDayDiff = null;
			}

			if(networkElement.customTimeRange)
			{
				ipamODECtrl.filterObj.customTimeRange = networkElement.customTimeRange;
			}
			else
			{
				ipamODECtrl.filterObj.customTimeRange = {
					filterType: null,
					customBucketSize: null,
					customBucketType: null
				};
			}

			// start time and end time
			ipamODECtrl.dateFilterForODE('resetTimeFilterDate', networkElement);

			try {
				$timeout(function(){

					ipamODECtrl.filterObj.startTime = ipamODECtrl.setZeroTimePart('remove',networkElement,networkElement.startTime);
					ipamODECtrl.filterObj.endTime = ipamODECtrl.setZeroTimePart('remove',networkElement,networkElement.endTime);

					if($('#datetimepickerodestart').data("DateTimePicker"))
					{
						$('#datetimepickerodestart').data("DateTimePicker").date(ipamODECtrl.filterObj.startTime);
						$('#datetimepickerodeend').data("DateTimePicker").date(ipamODECtrl.filterObj.endTime);
					}
				},500);
			} catch (e){
				console.error(e);
			}

			angular.element('#OdeDatelevelFilter').modal('show');

		}
		else if(action === 'FilterAttributesFlagChange')
		{
			if(ipamODECtrl.filterObj.attributeFilterFlag)
			{
				ipamODECtrl.filterObj.attributes.forEach(el=> {
					if(!el.values || !el.values.length)
					{
						ipamODECtrl.fillAttributeValueDFList(el);
					}
				});
			}
			else
			{
				ipamODECtrl.filterObj.attributes.forEach(el=> {
					delete el.values;
				});
			}
		}
		else if(action === 'FilterTypeChange')
		{
			if(ipamODECtrl.filterObj.timeSelectionType === "timeInterval")
			{
				ipamODECtrl.filterObj.numberOfBucket = null;
			}
		}
		else if(action === 'CustomFilterTypeChange')
		{
			ipamODECtrl.filterObj.customTimeRange.customBucketSize = null;
			ipamODECtrl.filterObj.customTimeRange.customBucketType = null;
		}
		else if(action === 'BucketTypeChange')
		{
			ipamODECtrl.filterObj.hourInput = [];
			ipamODECtrl.filterObj.hourList = [];
			ipamODECtrl.filterObj.quarterInput = [];
			ipamODECtrl.filterObj.quarterComboList = [];

			if(!ipamODECtrl.filterObj.bucketType) {
				ipamODECtrl.filterObj.bucketSize = "";
				ipamODECtrl.filterObj.bucketSizeList = [];
			}
			else {

				if(['Minutes'].includes(ipamODECtrl.filterObj.bucketType))
				{
					ipamODECtrl.filterObj.bucketSize = "";
					ipamODECtrl.filterObj.bucketSizeList = angular.copy(ipamODECtrl.setupBasedBucketSizeList);
				}
				else if(['Hours'].includes(ipamODECtrl.filterObj.bucketType))
				{
					ipamODECtrl.filterObj.quarterComboList = ipamODECtrl._.range(0,59,15);
					ipamODECtrl.filterObj.bucketSize = 1;
					ipamODECtrl.filterObj.bucketSizeList = [1];
				}
				else
				{
					ipamODECtrl.filterObj.bucketSize = 1;
					ipamODECtrl.filterObj.bucketSizeList = [1]
				}
			}
		}
		else if(action === 'BucketSizeChange')
		{
			if(['Minutes'].includes(ipamODECtrl.filterObj.bucketType))
			{
				ipamODECtrl.filterObj.hourInput = [];
				ipamODECtrl.filterObj.hourList = [];
				ipamODECtrl.filterObj.quarterInput = [];
				ipamODECtrl.filterObj.quarterComboList = ipamODECtrl._.range(0,59,ipamODECtrl.filterObj.bucketSize);
			}
		}
		else if(action === 'addAll')
		{
			ipamODECtrl.filterObj.hourInput = ipamODECtrl._.range(24);
		}
		else if(action === 'removeAll')
		{
			ipamODECtrl.filterObj.hourInput = [];
		}
		else if(action === 'addAllQuarters')
		{
			ipamODECtrl.filterObj.quarterInput = angular.copy(ipamODECtrl.filterObj.quarterComboList);
		}
		else if(action === 'removeAllQuarters')
		{
			ipamODECtrl.filterObj.quarterInput = [];
		}
		else if(action === 'addToHourListTable')
		{
			ipamODECtrl.filterObj.hourInput.forEach(hour=> {
				ipamODECtrl.filterObj.quarterInput.forEach(quarter=> {
					if(!ipamODECtrl.filterObj.hourList.find(el => el.hour === hour && el.minute === quarter))
					{
						ipamODECtrl.filterObj.hourList.push({'hour': hour, 'minute': quarter});
					}
				})
			})
			ipamODECtrl.filterObj.hourInput = [];
			ipamODECtrl.filterObj.quarterInput = [];
			ipamODECtrl.sortHourArr(ipamODECtrl.filterObj.hourList);
		}
		else if(action === 'addAllToHourListTable')
		{
			ipamODECtrl.filterObj.hourList = [];
			ipamODECtrl._.range(24).forEach(hour=> {
				ipamODECtrl.filterObj.quarterComboList.forEach(quarter=> {
					ipamODECtrl.filterObj.hourList.push({'hour': hour, 'minute': quarter});
				});
			})
			ipamODECtrl.filterObj.hourInput = [];
			ipamODECtrl.filterObj.quarterInput = [];
			ipamODECtrl.sortHourArr(ipamODECtrl.filterObj.hourList);
		}
		else if(action === 'clearHourListTable')
		{
			ipamODECtrl.filterObj.hourList = [];
		}
		else if(action === 'addAllHourstoHourList')
		{
			ipamODECtrl._.range(24).forEach(hour=> {
				ipamODECtrl.filterObj.hourList.push(hour);
			})
		}
		else if(action === 'removeAllHoursfromHourList')
		{
			ipamODECtrl.filterObj.hourList = [];
		}
		else if(action === 'deleteFromHourListTable')
		{
			var deleteIndex = ipamODECtrl.filterObj.hourList.findIndex(el => el === finalObj);
			ipamODECtrl.filterObj.hourList.splice(deleteIndex, 1);
		}
		else if(action === 'resetTimeFilterDate')
		{

			// clear date models
			ipamODECtrl.filterObj.startTime = "";
			ipamODECtrl.filterObj.endTime = "";

			// destroy the datepicker and unbind the previous dp.change event listener
			try {

				if($("#datetimepickerodestart").data("DateTimePicker"))
				{
					$('#datetimepickerodestart').data("DateTimePicker").clear();
					$('#datetimepickerodeend').data("DateTimePicker").clear();

					$("#datetimepickerodestart").unbind("dp.change");
					$("#datetimepickerodeend").unbind("dp.change");

					$("#datetimepickerodestart").datetimepicker("destroy");
					$("#datetimepickerodeend").datetimepicker("destroy");
				}

				if($("#odemultidatefilterdivid").data("DateTimePicker"))
				{
					$('#odemultidatefilterdivid').data("DateTimePicker").clear();

					$("#odemultidatefilterdivid").unbind("dp.change");

					$("#odemultidatefilterdivid").datetimepicker("destroy");
				}

			} catch(e) {
				console.error(e);
			}

			// get dateType
			var dateType = ipamODECtrl.getDateType(ipamODECtrl.filterObj.networkElement);

			//set date field pattern and error message
			ipamODECtrl.filterObj.datePattern = dateType === 'Normal' ?
					/^\d\d\d\d-([0]{0,1}[1-9]|1[012])-([1-9]|([012][0-9])|(3[01]))-(20|21|22|23|[0-1]?\d):[0-5]?\d:[0-5]?\d$/ :
					/^\d\d\d\d-([0]{0,1}[1-9]|1[012])-([1-9]|([012][0-9])|(3[01]))$/;
			ipamODECtrl.filterObj.datePatternErrorMsg = dateType === 'Normal' ? 'datetimepicker' : 'datepicker';

			// enable disable end date field
			ipamODECtrl.disableTimeFilterEndDate = ipamODECtrl.disableEndDate(dateType, ipamODECtrl.filterObj.networkElement.aggregationOperationType);

			ipamODECtrl.filterObj.disableSelectiveDates = ipamODECtrl.disableSelectiveDatesFn(dateType);

			var minDate = (ipamODECtrl.isReadOnlyRole && finalObj && finalObj.baseDate) ? (finalObj.baseDate + "-00:00:00") : undefined;

			// set date picker and bind dp.change Listeners
			$timeout(function(){

				$('#odemultidatefilterdivid').datetimepicker({
					format : 'YYYY-MM-DD-00:00:00',
					minDate: minDate,
					maxDate: "now",
					useCurrent: false,
					keepOpen: true,
					widgetPositioning: {horizontal: 'right', vertical: 'bottom'}
				});

				$("#odemultidatefilterdivid").on("dp.change", function(e) {

					$timeout(function(){
						$scope.$apply(function() {
							if($("#odemultidatefilter").val() && !ipamODECtrl.filterObj.selectiveDates.includes($("#odemultidatefilter").val()))
							{
								ipamODECtrl.filterObj.selectiveDates.push($("#odemultidatefilter").val());
								ipamODECtrl.filterObj.selectiveDates.sort();
							}
						});
					},0);
				});

				if(dateType === 'Normal')
				{
					// start Time
					$('#datetimepickerodestart').datetimepicker({
						format : 'YYYY-MM-DD-HH:mm:ss',
						minDate: minDate,
						maxDate: "now",
						useCurrent: false,
						keepOpen: false,
						widgetPositioning: {horizontal: 'right', vertical: 'bottom'}
					});

					$("#datetimepickerodestart").on( "dp.change", function(e) {

						$timeout(function(){
							$scope.$apply(function() {
								ipamODECtrl.filterObj.startTime = $("#odestarttime").val();
							});
						},0);

						// $('#datetimepickerodeend').data("DateTimePicker").minDate(e.date);
						$('#datetimepickerodeend').data("DateTimePicker").clear();
					});

					// end Time
					$('#datetimepickerodeend').datetimepicker({
						format : 'YYYY-MM-DD-HH:mm:ss',
						maxDate: "now",
						useCurrent: false,
						keepOpen: false,
						widgetPositioning: { horizontal: 'right', vertical: 'bottom'}
					});

					$("#datetimepickerodeend").on( "dp.change", function(e) {

						$timeout(function(){
							$scope.$apply(function() {
								ipamODECtrl.filterObj.endTime = $("#odeendtime").val();
							});
						},0);
					});
				}
				else if(['Delta Execution','Dual Time','Busy Hour','Supporting Kpi','Calculate Aging'].includes(dateType))
				{
					// start Time
					$('#datetimepickerodestart').datetimepicker({
						format : 'YYYY-MM-DD',
						minDate: minDate,
						maxDate: "now",
						useCurrent: false,
						keepOpen: false,
						widgetPositioning: {horizontal: 'right', vertical: 'bottom'}
					});

					$("#datetimepickerodestart").on( "dp.change", function(e) {

						$timeout(function(){
							$scope.$apply(function() {
								ipamODECtrl.filterObj.startTime = $("#odestarttime").val();
							});
						},0);

						// $('#datetimepickerodeend').data("DateTimePicker").minDate(e.date);
						$('#datetimepickerodeend').data("DateTimePicker").clear();

						if($("#odestarttime").val()) {
							$('#datetimepickerodeend').data("DateTimePicker").date(moment($("#odestarttime").val()).add(1,'days'));
						}
					});

					// end Time
					$('#datetimepickerodeend').datetimepicker({
						format : 'YYYY-MM-DD',
						maxDate: moment().add(1,'days').set({'hour': 0, 'minute': 0, 'second': 0}),
						useCurrent: false,
						keepOpen: false,
						widgetPositioning: { horizontal: 'right', vertical: 'bottom'}
					});

					$("#datetimepickerodeend").on( "dp.change", function(e) {

						$timeout(function(){
							$scope.$apply(function() {
								ipamODECtrl.filterObj.endTime = $("#odeendtime").val();
							});
						},0);
					});
				}

			},300);

		}
	}



	ipamODECtrl.fillAttributeValueDFList=function(attrObj){

		var queryString = "operation=getAggregationFieldValueList";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"fieldName": attrObj.fieldName
		};

		header.aggregationOn = ipamODECtrl.filterObj.networkElement.aggregationOn;

		if(ipamODECtrl.filterObj.networkElement.aggregationOn != 'HNA')
		{
			header.nodeName = ipamODECtrl.filterObj.networkElement.nodeName;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					attrObj.attributeValueList = response.AppData.appdata.resultList;

					if(!attrObj.attributeValueList || !attrObj.attributeValueList.length) {
						// ATOMService.showMessage('error','WARNING','Specific Value List is empty');
					}
				}
				else
				{
					// ATOMService.showMessage('error','WARNING','Unable to fetch Specific Value List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				// ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.selectiveDatesFilterFn=function(action,date=null){
		if(action === 'Delete')
		{
			var deleteIndex = ipamODECtrl.filterObj.selectiveDates.indexOf(date);
			if(deleteIndex != -1)
				ipamODECtrl.filterObj.selectiveDates.splice(deleteIndex,1);
		}
		else if(action === 'ClearAll')
		{
			ipamODECtrl.filterObj.selectiveDates = [];
			ipamODECtrl.filterObj.selectiveDatesModel = "";
			$('#odemultidatefilterdivid').data("DateTimePicker").clear();
		}
		else if(action === 'convertToDateObject')
		{
			return moment(date, "YYYY-MM-DD-HH:mm:ss").toDate();
		}
	}


	ipamODECtrl.saveApplyFilterForODE=function(action) {

		var index = ipamODECtrl.filterObj.index;
		var finalObj = ipamODECtrl.finalData.find(item=> item.index === index);

		var networkElement = finalObj.networkElement;

		if(action === 'apply') {

			if(!ipamODECtrl.filterObj.timeSelectionType)
			{
				ATOMService.showMessage('error','ERROR','Please select time filter type.');
				return;
			}

			var baseDate = (ipamODECtrl.isReadOnlyRole && networkElement && networkElement.baseDate) ? (networkElement.baseDate + "-00:00:00") : undefined;

			if(baseDate)
			{
				baseDate = moment(baseDate, "YYYY-MM-DD-HH:mm:ss");
				var baseDays = Math.ceil(moment.duration(moment().diff(baseDate)).asDays());

				if(ipamODECtrl.filterObj.timeSelectionType === "timeInterval")
				{
					// restricted from calendar
				}
				else if(ipamODECtrl.filterObj.timeSelectionType === "pastNthDay")
				{
					if(ipamODECtrl.filterObj.networkDayDiff >= baseDays)
					{
						ATOMService.showMessage('error','ERROR','Past N<sup>th</sup> Day: Maximum allowed value is ' + (baseDays-1) + " .");
						return;
					}
				}
				else if(ipamODECtrl.filterObj.timeSelectionType === "customTimeRange")
				{
					if(ipamODECtrl.filterObj.customTimeRange.customBucketType === 'Days' && ipamODECtrl.filterObj.customTimeRange.customBucketSize >= baseDays)
					{
						ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + (baseDays - 1) + ".");
						return;
					}
					else if(ipamODECtrl.filterObj.customTimeRange.customBucketType === 'Hours')
					{
						var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
						var hours = Math.floor(moment.duration(moment().diff(startTime)).asHours());
						if(ipamODECtrl.filterObj.customTimeRange.customBucketSize > hours)
						{
							ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + hours + ".");
							return;
						}
					}
					else if(ipamODECtrl.filterObj.customTimeRange.customBucketType === 'Minutes')
					{
						var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
						var minutes = Math.floor(moment.duration(moment().diff(startTime)).asMinutes());
						if(ipamODECtrl.filterObj.customTimeRange.customBucketSize > minutes)
						{
							ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + minutes + ".");
							return;
						}
					}
					else if(ipamODECtrl.filterObj.customTimeRange.customBucketType === 'Weeks')
					{
						var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
						var weeks = Math.floor(moment.duration(moment().diff(startTime)).asWeeks());
						if(ipamODECtrl.filterObj.customTimeRange.customBucketSize > weeks)
						{
							ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + weeks + ".");
							return;
						}
					}
					else if(ipamODECtrl.filterObj.customTimeRange.customBucketType === 'Months')
					{
						var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
						var months = Math.floor(moment.duration(moment().diff(startTime)).asMonths());
						if(ipamODECtrl.filterObj.customTimeRange.customBucketSize > months)
						{
							ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + months + ".");
							return;
						}
					}
					else if(ipamODECtrl.filterObj.customTimeRange.customBucketType === 'Years')
					{
						var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
						var years = Math.floor(moment.duration(moment().diff(startTime)).asYears());
						if(ipamODECtrl.filterObj.customTimeRange.customBucketSize > years)
						{
							ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + years + ".");
							return;
						}
					}
				}
				else if(ipamODECtrl.filterObj.timeSelectionType === "TimeBuckets")
				{

					if(ipamODECtrl.filterObj.bucketType === 'Days')
					{
						
						if(ipamODECtrl.filterObj.numberOfBucket >= baseDays)
						{
							ATOMService.showMessage('error','ERROR','Number of Buckets: Maximum allowed value is ' + (baseDays - 1) + ".");
							return;
						}
						else if(!ipamODECtrl.filterObj.numberOfBucket
								&& ipamODECtrl.filterObj.numberOfBucket !== 0
								&& ipamODECtrl.bucketTypeMapping[ipamODECtrl.filterObj.bucketType] >= baseDays)
						{
							ATOMService.showMessage('error','ERROR','Number of Buckets is mandatory and maximum allowed value is ' + (baseDays - 1) + ".");
							return;
						}
					}
					else if(ipamODECtrl.filterObj.bucketType === 'Weeks')
					{
						var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
						var weeks = Math.floor(moment.duration(moment().diff(startTime)).asWeeks());

						if(ipamODECtrl.filterObj.numberOfBucket >= weeks)
						{
							ATOMService.showMessage('error','ERROR','Number of Buckets: Maximum allowed value is ' + weeks + ".");
							return;
						}
						else if(!ipamODECtrl.filterObj.numberOfBucket
								&& ipamODECtrl.filterObj.numberOfBucket !== 0
								&& ipamODECtrl.bucketTypeMapping[ipamODECtrl.filterObj.bucketType] >= weeks)
						{
							ATOMService.showMessage('error','ERROR','Number of Buckets is mandatory and maximum allowed value is ' + weeks + ".");
							return;
						}
					}
					else if(ipamODECtrl.filterObj.bucketType === 'Months')
					{
						var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
						var months = Math.floor(moment.duration(moment().diff(startTime)).asMonths());

						if(ipamODECtrl.filterObj.numberOfBucket >= months)
						{
							ATOMService.showMessage('error','ERROR','Number of Buckets: Maximum allowed value is ' + months + ".");
							return;
						}
						else if(!ipamODECtrl.filterObj.numberOfBucket
								&& ipamODECtrl.filterObj.numberOfBucket !== 0
								&& ipamODECtrl.bucketTypeMapping[ipamODECtrl.filterObj.bucketType] >= months)
						{
							ATOMService.showMessage('error','ERROR','Number of Buckets is mandatory and maximum allowed value is ' + months + ".");
							return;
						}
					}
					else if(ipamODECtrl.filterObj.bucketType === 'Years')
					{
						var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
						var years = Math.floor(moment.duration(moment().diff(startTime)).asYears());

						if(ipamODECtrl.filterObj.numberOfBucket >= years)
						{
							ATOMService.showMessage('error','ERROR','Number of Buckets: Maximum allowed value is ' + years + ".");
							return;
						}
						else if(!ipamODECtrl.filterObj.numberOfBucket
								&& ipamODECtrl.filterObj.numberOfBucket !== 0
								&& ipamODECtrl.bucketTypeMapping[ipamODECtrl.filterObj.bucketType] >= years)
						{
							ATOMService.showMessage('error','ERROR','Number of Buckets is mandatory and maximum allowed value is ' + years + ".");
							return;
						}
					}
				}
			}

			if((ipamODECtrl.filterObj.hourInput && ipamODECtrl.filterObj.hourInput.length)
				|| (ipamODECtrl.filterObj.quarterInput && ipamODECtrl.filterObj.quarterInput.length))
			{
				ATOMService.showMessage('error','ERROR','Hour/Quarter values selected. Either clear input fields or add valid data to quarter table.');
				return;
			}

			networkElement.timeSelectionType = ipamODECtrl.filterObj.timeSelectionType;

			if(ipamODECtrl.filterObj.timeSelectionType === "timeInterval"
			|| ipamODECtrl.filterObj.timeSelectionType === 'pastNthDay'
			|| ipamODECtrl.filterObj.timeSelectionType === 'customTimeRange'
			|| ipamODECtrl.filterObj.timeSelectionType === 'selectiveDates')
			{
				if(ipamODECtrl.filterObj.timeSelectionType === "timeInterval")
				{
					var startTimeModified = ipamODECtrl.setZeroTimePart('add',networkElement,ipamODECtrl.filterObj.startTime);
					var endTimeModified = ipamODECtrl.setZeroTimePart('add',networkElement,ipamODECtrl.filterObj.endTime);

					if(moment(startTimeModified, "YYYY-MM-DD-HH:mm:ss") > moment(endTimeModified, "YYYY-MM-DD-HH:mm:ss")){
						ATOMService.showMessage('error','ERROR','End time can not be less than start time. ');
						return;
					}

					networkElement.startTime = startTimeModified;
					networkElement.endTime = endTimeModified;
				}
				else
				{
					delete networkElement.startTime;
					delete networkElement.endTime;
				}

				if(ipamODECtrl.filterObj.timeSelectionType === "selectiveDates")
				{
					if(!ipamODECtrl.filterObj.selectiveDates || !ipamODECtrl.filterObj.selectiveDates.length)
					{
						ATOMService.showMessage('error','ERROR','Selective dates is required field. ');
						return;
					}

					networkElement.selectiveDates = ipamODECtrl.filterObj.selectiveDates;
				}
				else
				{
					delete networkElement.selectiveDates;
				}

				if(ipamODECtrl.filterObj.timeSelectionType === 'pastNthDay')
				{
					networkElement.networkDayDiff = ipamODECtrl.filterObj.networkDayDiff;
				}
				else
				{
					delete networkElement.networkDayDiff;
				}

				if(ipamODECtrl.filterObj.timeSelectionType === 'customTimeRange')
				{
					networkElement.customTimeRange = {
						filterType: ipamODECtrl.filterObj.customTimeRange.filterType
					};

					if(ipamODECtrl.filterObj.customTimeRange.filterType === 'Last')
					{
						networkElement.customTimeRange.customBucketType = ipamODECtrl.filterObj.customTimeRange.customBucketType;
						networkElement.customTimeRange.customBucketSize = ipamODECtrl.filterObj.customTimeRange.customBucketSize;
					}
				}
				else
				{
					delete networkElement.customTimeRange;
				}

				if(ipamODECtrl.filterObj.bucketType) {

					networkElement.bucketType = ipamODECtrl.filterObj.bucketType;
					networkElement.bucketSize = ipamODECtrl.filterObj.bucketSize;
					networkElement.counter = ipamODECtrl.getCounterValueUsingBucket(ipamODECtrl.filterObj.bucketType, ipamODECtrl.filterObj.bucketSize);
				}
				else
				{
					networkElement.counter = 4;
					if(networkElement.aggregationOperationType === 'timeBasedAggregation')
					{
						ipamODECtrl.getBucketValueUsingCounter(networkElement.counter, networkElement);
					}
				}

				if(ipamODECtrl.filterObj.numberOfBucket)
					networkElement.numberOfBucket = ipamODECtrl.filterObj.numberOfBucket;
				else
					delete networkElement.numberOfBucket;
			}
			else
			{
				networkElement.bucketType = ipamODECtrl.filterObj.bucketType;
				networkElement.bucketSize = ipamODECtrl.filterObj.bucketSize;
				networkElement.counter = ipamODECtrl.getCounterValueUsingBucket(ipamODECtrl.filterObj.bucketType, ipamODECtrl.filterObj.bucketSize);
				networkElement.numberOfBucket = ipamODECtrl.filterObj.numberOfBucket;

				delete networkElement.timeSelectionType;
				delete networkElement.startTime;
				delete networkElement.endTime;
				delete networkElement.networkDayDiff;
				delete networkElement.customTimeRange;
				delete networkElement.selectiveDates;
			}

			if(ipamODECtrl.filterObj.hourList && ipamODECtrl.filterObj.hourList.length)
			{
				networkElement.hourList = ipamODECtrl.filterObj.hourList;
			}
			else {
				delete networkElement.hourList;
			}

			var attributes = angular.copy(ipamODECtrl.filterObj.attributes);
			if(attributes && attributes.length)
			{
				attributes.forEach(el=> {
					if(!el.values || !el.values.length)
						delete el.values;
					delete el.attributeValueList;
				});
	
				networkElement.attributes = attributes;
			}

			if(networkElement.executionMode === 'RealTime' && networkElement.timeSelectionType && ['pastNthDay','customTimeRange'].includes(networkElement.timeSelectionType))
			{
				networkElement.realTimeExecutionWithTimeSelectionFlag = true;
			}
			else
			{
				delete networkElement.realTimeExecutionWithTimeSelectionFlag;
			}

			ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, index, 'timeFilterChange');
		}
		else if (action === 'remove')
		{
			try {
				networkElement.counter = 4;

				if(networkElement.aggregationOperationType === 'timeBasedAggregation')
				{
					ipamODECtrl.getBucketValueUsingCounter(networkElement.counter, networkElement);
				}

				delete networkElement.timeSelectionType;
				delete networkElement.networkDayDiff;
				delete networkElement.startTime;
				delete networkElement.endTime;
				delete networkElement.numberOfBucket
				delete networkElement.hourList;
				delete networkElement.customTimeRange;
				delete networkElement.selectiveDates;
			} catch (e){
			}

			ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, index, 'timeFilterChange');
		}

	}


	ipamODECtrl.headerUpdateFn=function(action, data ,headerCrud='update') {

		if(action === 'openModal')
		{
			var ne = data.networkElement;

			// get dateType
			ipamODECtrl.huObj = {
				headerCrud:headerCrud,
				ne: ne,
				index: data.index,
				nodeName: ne.nodeName,
				reportType: ne.reportType,
				headerList: headerCrud==="update"? angular.copy(ne.headerList):[],
				headerFilterList: angular.copy(ne.headerFilterList),
				search: "",
				rowIndex: -1,
				counterRow: null,
				kpiRow: null,

				viewKpiList: [],
				kpiObject: null,
				kpiHeader: null,

				counterType: 'selectedCounter',
				categoryName: null,
				viewCounterCategoryList: [],
				counterNameList: [],
				viewCounterNameList: [],
				disableSelectiveDates: (ne.timeSelectionType === 'selectiveDates')
			};
			if(ne.executionType === 'SingleProduct')
			{
				if(ne.reportType === 'Kpi')
				{
					ipamODECtrl.headerUpdateGetKPIList();
				}
				else if(ne.reportType === 'Counter')
				{
					ipamODECtrl.headerUpdateGetCategoryList();
				}
			}

			angular.element('#modalForHeaderUpdate').modal('show');
		}
		
		else if(action === 'delete')
		{
			if(ipamODECtrl.huObj.headerList.length === 1)
			{
				ATOMService.showMessage('error','WARNING','Deletion not allowed as minimum one header row is required. ');
				return;
			}

			elementIndexInArr = ipamODECtrl.huObj.headerList.findIndex(el => el.name === data.name);

			ipamODECtrl.huObj.headerList.splice(elementIndexInArr,1);

			// update headerFilterList
			if(ipamODECtrl.huObj.headerFilterList && ipamODECtrl.huObj.headerFilterList.length)
			{
				var deleteIndex = ipamODECtrl.huObj.headerFilterList.findIndex(el=> el.headerName === data.name);

				if(deleteIndex >= 0)
					ipamODECtrl.huObj.headerFilterList.splice(deleteIndex,1);
			}

		}
		else if(action === 'changeDeltaExecFlag')
		{
			var kpi = ipamODECtrl.huObj.headerList.find(el => el === data);
			if(kpi.deltaExecFlag === false)
			{
				kpi.valueCompareFromBaseFlag = null;
				kpi.percentageFlag = false;
				kpi.dayDiff = null;
				kpi.dayDiffDeltaFlag = false;
				kpi.operationType = null;
			}
			else
			{
				kpi.counterRequired = false;
				// open edit kpi modal
				ipamODECtrl.headerUpdateKPIRow('openModal', data);
			}
		}
		else if(action === "onODENodeNameChange")
		{
			ipamODECtrl.huObj.categoryName = "";
			ipamODECtrl.huObj.counterNameList = [];
			ipamODECtrl.huObj.categoryNameList = [];
			ipamODECtrl.huObj.viewCounterNameList = [];

			ipamODECtrl.huObj.viewKpiList = [];
			ipamODECtrl.huObj.kpiObject = null;
			ipamODECtrl.huObj.kpiHeader = null;

			if(ipamODECtrl.huObj.reportType === 'Counter' || (ipamODECtrl.huObj.reportType === 'Mixed' && ipamODECtrl.huObj.headerType === 'Counter')) {
				ipamODECtrl.headerUpdateGetCategoryList();
			}
			else if(ipamODECtrl.huObj.reportType === 'Kpi' || (ipamODECtrl.huObj.reportType === 'Mixed' && ipamODECtrl.huObj.headerType === 'Kpi')) {
				ipamODECtrl.headerUpdateGetKPIList();
			}
		}
		else if(action === 'kpiSelectionChange') {

			if(!ipamODECtrl.huObj.kpiObject)
				 ipamODECtrl.huObj.kpiHeader = null;
			else
				ipamODECtrl.huObj.kpiHeader = ipamODECtrl.huObj.kpiObject.kpiName;
		}
		else if(action === 'addKpi') {

			if(!ipamODECtrl.huObj.kpiObject || !ipamODECtrl.huObj.kpiHeader)
				return;

			var kpiObject = ipamODECtrl.huObj.kpiObject;

			if(ipamODECtrl.huObj.headerList.find(el=> el.type === 'kpi' && el.name === kpiObject.kpiName))
			{
				ATOMService.showMessage('error','WARNING','KPI already added. ');
				return;
			}

			if(ipamODECtrl.huObj.headerList.find(el=> el.headerName === ipamODECtrl.huObj.kpiHeader))
			{
				ATOMService.showMessage('error','WARNING','Header name already added. ');
				return;
			}

            if(ipamODECtrl.huObj.headerCrud==='add')
			{
				if(ipamODECtrl.huObj.ne.headerList.find(el=> el.type === 'kpi' && el.name === kpiObject.kpiName))
				{
					ATOMService.showMessage('error','WARNING','KPI already added. ');
					return;
				}
	
				if(ipamODECtrl.huObj.ne.headerList.find(el=> el.headerName === ipamODECtrl.huObj.kpiHeader))
				{
					ATOMService.showMessage('error','WARNING','Header name already added. ');
					return;
				}
			}

			var kpi = {
				nodeName: ipamODECtrl.huObj.nodeName,
				sumRequired: true,
				counterRequired: false,
				name: kpiObject.kpiName,
				headerName: ipamODECtrl.huObj.kpiHeader,
				type: 'kpi',
				timeBasedAggregation: (!kpiObject.timeBasedAggregation || kpiObject.timeBasedAggregation === "null") ? "sum" : kpiObject.timeBasedAggregation,
				hierachyBasedAggregation: (!kpiObject.hierachyBasedAggregation || kpiObject.hierachyBasedAggregation === "null") ? "sum" : kpiObject.hierachyBasedAggregation,

				supportingKpi: kpiObject.supportingKpi,

				isNestedNhPresentFlag: !!kpiObject.isNestedNhPresentFlag,
				isNhPresentFlag: !!kpiObject.isNhPresentFlag,
				isDefaultValueFlag: (kpiObject.isDefaultValueFlag !== false),

				consecutiveFlag: !!kpiObject.consecutiveFlag,
				interval: kpiObject.interval,
				nestedConsecutiveFlag: !!kpiObject.nestedConsecutiveFlag,
				nestedConsecutiveInterval: kpiObject.nestedConsecutiveInterval,

				modeFlag: !!kpiObject.modeFlag,

				deltaExecFlag: false,
				valueCompareFromBaseFlag: null,
				percentageFlag: false,
				dayDiff: null,
				dayDiffDeltaFlag: false,
				operationType: null,

				isNestedDual: !!kpiObject.isNested,
				agingFlag: !!kpiObject.agingFlag,
				agingPeriod: kpiObject.agingPeriod,

				isTimeShift: !!kpiObject.isTimeShift,
				nestedTimeShiftFlag: !!kpiObject.nestedTimeShiftFlag,

				isNotMissing: !!kpiObject.isNotMissing
			}

			if(kpiObject.busyHourDependentOperation)
			{
				kpi.busyHourDependentOperation = kpiObject.busyHourDependentOperation;
			}

			ipamODECtrl.huObj.headerList.push(kpi);

			ipamODECtrl.huObj.kpiObject = null;
			ipamODECtrl.huObj.kpiHeader = null;
		}
		else if(action === 'addNestedKPI-OpenModal')
		{
			var kpi = ipamODECtrl.huObj.headerList.find(el => el === data);

			ipamODECtrl.huNestedKPIObj = {
				kpiObj: kpi,
				nestedKPIList: [],
				searchTxt: "",
				selectAllFlag: false,
				pageNo: 1
			}

			ipamODECtrl.addNestedKPIGetKPIList(kpi);

			angular.element('#modalForHeaderUpdate').modal('hide');
			$timeout(function(){
				angular.element('#modalForAddNestedKPI').modal('show');
			},400);
		}
		else if(action === 'addNestedKPI-CloseModal')
		{
			angular.element('#modalForAddNestedKPI').modal('hide');
			$timeout(function(){
				angular.element('#modalForHeaderUpdate').modal('show');
			},400);
		}
		else if(action === 'addNestedKPI-SelectAllChange')
		{
			ipamODECtrl.huNestedKPIObj.selectAllFlag = !ipamODECtrl.huNestedKPIObj.selectAllFlag;
			ipamODECtrl.huNestedKPIObj.nestedKPIList.forEach(el=> el.isSelected = !!ipamODECtrl.huNestedKPIObj.selectAllFlag)
		}
		else if(action === 'addNestedKPI-AddKPIs')
		{
			var additionList = ipamODECtrl.huNestedKPIObj.nestedKPIList.filter(el=> !!el.isSelected);
			var removalNameList = ipamODECtrl.huNestedKPIObj.nestedKPIList.filter(el=> !el.isSelected).map(el=> el.kpiName);

			if(removalNameList.length)
			{
				ipamODECtrl.huObj.headerList = ipamODECtrl.huObj.headerList.filter(el=> el.type !== 'kpi' || !removalNameList.includes(el.name));
			}

			if(additionList.length)
			{

				var insertPos = ipamODECtrl.huObj.headerList.findIndex(el=> el === ipamODECtrl.huNestedKPIObj.kpiObj) + 1;

				additionList.forEach(el=>{
					var kpiObject = el;

					if(ipamODECtrl.huObj.headerList.find(header=> header.type === 'kpi' && header.name === kpiObject.kpiName))
					{
						return;
					}

					var kpi = {
						nodeName: kpiObject.nodeName || ipamODECtrl.huNestedKPIObj.kpiObj.nodeName,
						sumRequired: true,
						counterRequired: false,
						name: kpiObject.kpiName,
						headerName: kpiObject.kpiName,
						type: 'kpi',
						timeBasedAggregation: (!kpiObject.timeBasedAggregation || kpiObject.timeBasedAggregation === "null") ? "sum" : kpiObject.timeBasedAggregation,
						hierachyBasedAggregation: (!kpiObject.hierachyBasedAggregation || kpiObject.hierachyBasedAggregation === "null") ? "sum" : kpiObject.hierachyBasedAggregation,

						supportingKpi: kpiObject.supportingKpi,

						isNestedNhPresentFlag: !!kpiObject.isNestedNhPresentFlag,
						isNhPresentFlag: !!kpiObject.isNhPresentFlag,
						isDefaultValueFlag: (kpiObject.isDefaultValueFlag !== false),

						consecutiveFlag: !!kpiObject.consecutiveFlag,
						interval: kpiObject.interval,
						nestedConsecutiveFlag: !!kpiObject.nestedConsecutiveFlag,
						nestedConsecutiveInterval: kpiObject.nestedConsecutiveInterval,

						modeFlag: !!kpiObject.modeFlag,

						deltaExecFlag: false,
						valueCompareFromBaseFlag: null,
						percentageFlag: false,
						dayDiff: null,
						dayDiffDeltaFlag: false,
						operationType: null,

						isNestedDual: !!kpiObject.isNested,
						agingFlag: !!kpiObject.agingFlag,
						agingPeriod: kpiObject.agingPeriod,

						isTimeShift: !!kpiObject.isTimeShift,
						nestedTimeShiftFlag: !!kpiObject.nestedTimeShiftFlag,

						isNotMissing: !!kpiObject.isNotMissing
					}

					if(kpiObject.busyHourDependentOperation)
					{
						kpi.busyHourDependentOperation = kpiObject.busyHourDependentOperation;
					}

					ipamODECtrl.huObj.headerList.splice(insertPos,0,kpi);
					insertPos++;
				})

			}

			ipamODECtrl.headerUpdateFn('addNestedKPI-CloseModal',null);
		}
		else if(action === 'HeaderType-Changed-To-Kpi' || action === 'HeaderType-Changed-To-Counter') {

			ipamODECtrl.huObj.viewKpiList = [];
			ipamODECtrl.huObj.kpiObject = null;
			ipamODECtrl.huObj.kpiHeader = null;

			ipamODECtrl.huObj.counterType = 'selectedCounter';
			ipamODECtrl.huObj.categoryName = null;
			ipamODECtrl.huObj.viewCounterCategoryList = [];
			ipamODECtrl.huObj.counterNameList = [];
			ipamODECtrl.huObj.viewCounterNameList = [];

			if(action === 'HeaderType-Changed-To-Kpi')
			{
				ipamODECtrl.headerUpdateGetKPIList();
			}
			else if(action === 'HeaderType-Changed-To-Counter')
			{
				ipamODECtrl.headerUpdateGetCategoryList();
			}
		}
		else if(action === 'addODESelectedCounters')
		{
			if(!ipamODECtrl.huObj.categoryName ||  !ipamODECtrl.huObj.counterNameList || ipamODECtrl.huObj.counterNameList.length==0)
				return;

			ipamODECtrl.huObj.counterNameList.forEach(counterObj => {

				var fullCounterName = ipamODECtrl.huObj.categoryName + ":" + counterObj.counterName;

				if(ipamODECtrl.huObj.headerList.find(el => el.fullCounterName === fullCounterName))
					return;

				if(ipamODECtrl.huObj.headerCrud==='add')
					{
						if(ipamODECtrl.huObj.ne.headerList.find(el => el.fullCounterName === fullCounterName))
						{
							ATOMService.showMessage('error','WARNING','Counter name already added. ');
							return;
						}
					}
				

				var counterData = {
					fullCounterName: fullCounterName,
					nodeName: ipamODECtrl.huObj.nodeName,
					sumRequired: true,
					counterRequired: false,
					name: fullCounterName,
					counterCategory: ipamODECtrl.huObj.categoryName,
					counterName: counterObj.counterName,
					timeBasedAggregation:
						(!counterObj.timeBasedAggregation || counterObj.timeBasedAggregation === "null") ?
								"sum" : counterObj.timeBasedAggregation,
					hierachyBasedAggregation:
						(!counterObj.hierachyBasedAggregation || counterObj.hierachyBasedAggregation === "null") ?
							"sum" : counterObj.hierachyBasedAggregation,
					headerName: fullCounterName,
					type: 'counter',
					subNeApplicable: false,
					nhApplicable: false
				};

				ipamODECtrl.huObj.headerList.push(counterData);
			});

			ipamODECtrl.huObj.categoryName = "";
			ipamODECtrl.huObj.counterNameList = [];
			ipamODECtrl.huObj.viewCounterNameList = [];
		}
		else if(action === 'restore')
		{
			// update network element
			let index = ipamODECtrl.huObj.index;
			var finalObj = ipamODECtrl.finalData.find(item=> item.index === index);
			let ne = finalObj.networkElement;
			let headerList = [];
			let headerFilterList = [];

			if(ne.immutableHeaderList)
			{
				headerList = angular.copy(ne.immutableHeaderList);
				headerFilterList = angular.copy(ne.immutableHeaderFilterList);
			}
			else
			{
				headerList = angular.copy(ne.headerList);
				headerFilterList = angular.copy(ne.headerFilterList);
			}

			ipamODECtrl.huObj = {
				ne: ne,
				index: index,
				nodeName: ne.nodeName,
				reportType: ne.reportType,
				headerFilterList: angular.copy(ne.headerFilterList),
				search: "",
				rowIndex: -1,
				counterRow: null,
				kpiRow: null,

				viewKpiList: [],
				kpiObject: null,
				kpiHeader: null,

				counterType: 'selectedCounter',
				categoryName: null,
				viewCounterCategoryList: [],
				counterNameList: [],
				viewCounterNameList: []
			};

			ipamODECtrl.huObj.headerList = headerList;
			ipamODECtrl.huObj.headerFilterList = headerFilterList;

			if(ne.executionType === 'SingleProduct')
			{
				if(ne.reportType === 'Kpi')
				{
					ipamODECtrl.headerUpdateGetKPIList();
				}
				else if(ne.reportType === 'Counter')
				{
					ipamODECtrl.headerUpdateGetCategoryList();
				}
			}
		}
		else if(action === 'apply')
		{

			// validations
			if(ipamODECtrl.huObj.ne.headerPosition === 'row')
			{
				ipamODECtrl.huObj.headerList.forEach(el => {

					if(el.type === 'kpi')
					{
						el.deltaExecFlag = false;
						el.valueCompareFromBaseFlag = null;
						el.percentageFlag = false;
						el.dayDiff = null;
						el.dayDiffDeltaFlag = false;
						el.operationType = null;
					}
				});
			}
			else if(ipamODECtrl.huObj.ne.headerPosition === 'column')
			{
				if(ipamODECtrl.huObj.headerList.find(el=> el.type === 'kpi' && el.deltaExecFlag))
				{
					var invalidDeltaKpi = ipamODECtrl.huObj.headerList.find(el=> {

						if(el.type === 'kpi' && el.deltaExecFlag &&
								(!el.operationType
										|| (!el.dayDiff && el.dayDiff !== 0)
										|| (![true,false].includes(el.valueCompareFromBaseFlag)))
						) {
							return true;
						}
						else
						{
							return false;
						}
					});

					if(invalidDeltaKpi)
					{
						ATOMService.showMessage('error','ERROR','Please enter valid delta data for KPI: ' + invalidDeltaKpi.name);
						return;
					}
				}

			}

			// update network element
			var finalObj = ipamODECtrl.finalData.find(item=> item.index === ipamODECtrl.huObj.index);
			let networkElement = finalObj.networkElement;

			// set immutable headers & immutable headerFilterList
			if(!networkElement.immutableHeaderList)
			{
				networkElement.immutableHeaderList = angular.copy(networkElement.headerList);
				networkElement.immutableHeaderFilterList = angular.copy(networkElement.headerFilterList);
			}

			if(ipamODECtrl.huObj.headerCrud==="update")
				{
					networkElement.headerList = ipamODECtrl.huObj.headerList;
				}
				else{
					networkElement.headerList = networkElement.headerList.concat(ipamODECtrl.huObj.headerList);
					networkElement.dynamicHeaderList=angular.copy(ipamODECtrl.huObj.headerList);
				}



			if(networkElement.headerPosition === 'column')
			{
				networkElement.maxDayDiff = ipamODECtrl.getMaxDayDiff(networkElement.headerList);
			}

			if(networkElement.headerPosition === 'column' && (ipamODECtrl.huObj.headerFilterList && ipamODECtrl.huObj.headerFilterList.length))
			{
				networkElement.headerFilterFlag = true;
				networkElement.headerFilterList = angular.copy(ipamODECtrl.huObj.headerFilterList);
			}
			else
			{
				networkElement.headerFilterFlag = false;
				delete networkElement.headerFilterList;
			}

			networkElement.maxAgingPeriod = ipamODECtrl.getMaxAgingPeriod(networkElement.headerList);
			networkElement.nestedTimeShiftFlag = ipamODECtrl.getNestedTimeShiftFlag(networkElement.headerList);
			networkElement.isNotMissing = ipamODECtrl.getIsNotMissingFlag(networkElement.headerList);
			// networkElement.maxTimeShiftValue = ipamODECtrl.getMaxTimeShiftValue(networkElement.headerList);
			networkElement.maxConsecutiveInterval = ipamODECtrl.getMaxConsecutiveInterval(networkElement.headerList);
			networkElement.agingFlag = ipamODECtrl.getAgingFlag([networkElement]);
			networkElement.isNestedNhPresentFlag = ipamODECtrl.getIsNestedNhPresentFlag(networkElement.headerList);
			networkElement.isNhPresentFlag = ipamODECtrl.getIsNhPresentFlag(networkElement.headerList);
			networkElement.modeFlag = ipamODECtrl.getModeFlag(networkElement.headerList);
			if(ipamODECtrl.getConsecutiveFlag([networkElement]))
				networkElement.consecutiveFlag = true;

			// refetch data
			if(!finalObj.requestId)
			{
				// if offline
				ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, ipamODECtrl.huObj.index, ipamODECtrl.huObj.headerCrud==="update"?'headerUpdate':'headerAdd');
			}
			else if(finalObj.requestId)
			{
				// if live
				ipamODECtrl.submitForRealTimeRun([finalObj], ipamODECtrl.huObj.headerCrud==="update"?'refreshLiveData-headerUpdate':'refreshLiveData-headerAdd');
			}
			angular.element('#modalForHeaderUpdate').modal('hide');
		}
	}


	ipamODECtrl.headerUpdateCounterRow=function(action, data){

		if(action === 'openModal')
		{
			var counter = ipamODECtrl.huObj.headerList.find(el => el === data);
			var counterIndex = ipamODECtrl.huObj.headerList.findIndex(el => el === data);

			ipamODECtrl.huObj.counterRow = angular.copy(counter);
			ipamODECtrl.huObj.rowIndex = counterIndex;
			angular.element('#modalForHeaderUpdate').modal('hide');
			$timeout(function(){
				angular.element('#modalForHeaderUpdateCounterRow').modal('show');
			},400);
		}
		else if(action === 'update')
		{

			var counter = ipamODECtrl.huObj.counterRow;

			if($scope.hucounterrowform.$invalid)
			{
				ATOMService.showMessage('error','WARNING','Please enter valid counter details. ');
				return;
			}

			if(counter.headerName && !counter.headerName.trim())
			{
				ATOMService.showMessage('error','WARNING','Please enter valid counter details. ');
				return;
			}

			if(ipamODECtrl.huObj.headerList.find(el=> el.name != counter.name && el.headerName === counter.headerName))
			{
				ATOMService.showMessage('error','WARNING','Header name already added. ');
				return;
			}

			counter.headerName = counter.headerName.trim();

			ipamODECtrl.huObj.headerList[ipamODECtrl.huObj.rowIndex] = angular.copy(counter);
			angular.element('#modalForHeaderUpdateCounterRow').modal('hide');
			$timeout(function(){
				angular.element('#modalForHeaderUpdate').modal('show');
			},400);
		}
		else if(action === 'closeModal')
		{
			angular.element('#modalForHeaderUpdateCounterRow').modal('hide');
			$timeout(function(){
				angular.element('#modalForHeaderUpdate').modal('show');
			},400);
		}
	}


	ipamODECtrl.headerUpdateKPIRow=function(action, data){

		if(action === 'openModal')
		{
			var kpi = ipamODECtrl.huObj.headerList.find(el => el === data);
			var kpiIndex = ipamODECtrl.huObj.headerList.findIndex(el => el === data);

			ipamODECtrl.huObj.kpiRow = angular.copy(kpi);
			ipamODECtrl.huObj.rowIndex = kpiIndex;
			angular.element('#modalForHeaderUpdate').modal('hide');
			$timeout(function(){
				angular.element('#modalForHeaderUpdateKpiRow').modal('show');
			},400);
		}
		else if(action === 'closeModal')
		{
			angular.element('#modalForHeaderUpdateKpiRow').modal('hide');
			$timeout(function(){
				angular.element('#modalForHeaderUpdate').modal('show');
			},400);
		}
		else if(action === 'deltaExecFlagChange')
		{
			var kpi = ipamODECtrl.huObj.kpiRow;
			if(kpi.deltaExecFlag === false)
			{
				kpi.valueCompareFromBaseFlag = null;
				kpi.percentageFlag = false;
				kpi.dayDiff = null;
				kpi.dayDiffDeltaFlag = false;
				kpi.operationType = null;
			}
			else
			{
				kpi.counterRequired = false;

			}
		}
		else if(action === 'valueCompareFromBaseFlagChange')
		{
			var kpi = ipamODECtrl.huObj.kpiRow;
			kpi.percentageFlag = false;
			kpi.dayDiffDeltaFlag = false;
		}
		else if(action === 'update')
		{
			var kpi = ipamODECtrl.huObj.kpiRow;

			if($scope.updateheaderkpirowform.$invalid)
			{
				ATOMService.showMessage('error','WARNING','Please enter valid KPI data. ');
				return;
			}

			if(ipamODECtrl.huObj.headerList.find(el=> el.name != kpi.name && el.headerName === kpi.headerName))
			{
				ATOMService.showMessage('error','WARNING','Header name already added. ');
				return;
			}

			if(ipamODECtrl.huObj.headerCrud==='add'){
				let index = ipamODECtrl.huObj.ne.headerList.find(el=> el.headerName === kpi.headerName);

				if(index)
					{
						ATOMService.showMessage('error','WARNING','Header name already added. ');
						return;
					}

			}
			
			

			ipamODECtrl.huObj.headerList[ipamODECtrl.huObj.rowIndex] = angular.copy(kpi);
			angular.element('#modalForHeaderUpdateKpiRow').modal('hide');
			$timeout(function(){
				angular.element('#modalForHeaderUpdate').modal('show');
			},400);
		}
	}



	ipamODECtrl.headerUpdateGetKPIList=function(){

		if(!ipamODECtrl.huObj.nodeName)
			return;

		var queryString = "operation=getKpiListAgg";

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"nodeName": ipamODECtrl.huObj.nodeName,
			"executionType": (ipamODECtrl.huObj.ne.executionType === 'MultipleProduct') ? 'MultiProduct' : 'SingleProduct'
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT, header, queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){

					ipamODECtrl.huObj.viewKpiList=response.AppData.appdata.resultList;

					if(ipamODECtrl.huObj.viewKpiList.length == 0){
						ATOMService.showMessage('error','WARNING','Kpi List is empty');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Kpi List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.addNestedKPIGetKPIList=function(kpi){

		var queryString = "operation=getNestedKpiList";

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"kpiName": kpi.name
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT, header, queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){

					ipamODECtrl.huNestedKPIObj.nestedKPIList = response.AppData.appdata.resultList;

					if(!ipamODECtrl.huNestedKPIObj.nestedKPIList.length){
						ATOMService.showMessage('error','WARNING','Nested KPI list is empty');
					}
					else
					{
						ipamODECtrl.huNestedKPIObj.nestedKPIList.forEach(el=> {
							el.isSelected = !!ipamODECtrl.huObj.headerList.find(headerObj=> headerObj.name === el.kpiName);
						});
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch nested KPI list. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.headerUpdateGetCategoryList=function(){

		if(!ipamODECtrl.huObj.nodeName)
			return;

		var queryString = "operation=getCounterCategoryList";

		var header = {
			"username":$rootScope.globals.currentUser.username,
			"nodeName":ipamODECtrl.huObj.nodeName
		};

		ATOMCommonServices.getMethodForVProbe(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){
					ipamODECtrl.huObj.viewCounterCategoryList = response.AppData.appdata.resultList;
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Category List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

	}


	ipamODECtrl.headerUpdateGetCounterList=function(){

		if(!ipamODECtrl.huObj.nodeName || !ipamODECtrl.huObj.categoryName)
			return;

		ipamODECtrl.huObj.counterNameList = [];
		ipamODECtrl.huObj.viewCounterNameList = [];

		var queryString="operation=getCounterNameListAgg";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"nodeName": ipamODECtrl.huObj.nodeName,
			"category": ipamODECtrl.huObj.categoryName
		};

		ATOMCommonServices.getMethodForVProbe(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){

					ipamODECtrl.huObj.viewCounterNameList = response.AppData.appdata.resultList;

					if(!ipamODECtrl.huObj.viewCounterNameList.length) {
						ATOMService.showMessage('error','WARNING','Counter List is empty. ');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Counter List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.openModalForAggrUpdateForODE=function(finalObj) {

		if(finalObj.requestId && $rootScope.streamingFlag)
		{
			ATOMService.showMessage('error','WARNING','You have to stop live stream in order to perform roll up/drill down. ');
			return;
		}

		var networkElement = finalObj.networkElement;

		ipamODECtrl.aggrUpdateObj = {
			index : finalObj.index,
			category: "",
			isCategorySpecific: "false",
			fieldObject: null,
			size: null,
			executionType: networkElement.executionType,
			aggregationOn: networkElement.currentAggregationOn ? networkElement.currentAggregationOn : networkElement.aggregationOn,
			nodeName: networkElement.nodeName,
			aggrFieldObjectList: [],
			rawCategoryViewList: []
		};

		ipamODECtrl.aggrUpdateObj.aggrList = angular.copy(networkElement.aggregationList.row);

		//If MultipleProduct initialize HNA aggregations
		if(ipamODECtrl.aggrUpdateObj.executionType === 'MultipleProduct' && ipamODECtrl.aggrUpdateObj.aggregationOn != 'HNA')
		{
			ipamODECtrl.aggrUpdateObj.aggregationOn = 'HNA';

			if(networkElement.runtimeFilters && networkElement.runtimeFilters.length)
			{
				var aggr = angular.copy(networkElement.runtimeFilters[0]);
				aggr.size = 25;
				aggr.level = 1;
				aggr.specific = (aggr.specificList && aggr.specificList.length) ? true : false;
			}
			ipamODECtrl.aggrUpdateObj.aggrList = [aggr];
		}

		// fetch field name List
		ipamODECtrl.fetchODEFiledNameListForAggrUpdate(ipamODECtrl.aggrUpdateObj);

		// fetch field value List
		ipamODECtrl.aggrUpdateObj.aggrList.forEach(aggr=> {
			if(aggr.specific && !aggr.specificValueList)
				ipamODECtrl.fetchODEFiledValueListForAggrUpdate(aggr);
		});

		angular.element('#OdeAggrUpdate').modal('show');
	}


	ipamODECtrl.fetchODEFiledNameListForAggrUpdate=function(data){

		ipamODECtrl.aggrUpdateObj.aggrFieldObjectList = [];

		var aggregationOn = data.aggregationOn;

		var queryString = "operation=getAggregationFieldNameList";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"aggregationOn": aggregationOn
		};

		if(aggregationOn != 'HNA')
		{
			header.nodeName = data.nodeName;

			if(!header.nodeName)
				return;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(

			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.aggrUpdateObj.aggrFieldObjectList = response.AppData.appdata.resultList;

					if(!ipamODECtrl.aggrUpdateObj.aggrFieldObjectList || ipamODECtrl.aggrUpdateObj.aggrFieldObjectList.length === 0)
					{
						ATOMService.showMessage('error','WARNING','Field Name List is Empty. ');
					} else
					{
						if(typeof ipamODECtrl.aggrUpdateObj.aggrFieldObjectList[0] === 'string') {
							ipamODECtrl.aggrUpdateObj.aggrFieldObjectList = ipamODECtrl.aggrUpdateObj.aggrFieldObjectList.map(el => {return {fieldName: el};});
						}

					}
				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch Field Name List. Please contact admin. ');
				}
			},
			function errorCallback(responseData) {
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

	}


	ipamODECtrl.categoryFlagChangeForAggrUpdate=function(){

		ipamODECtrl.aggrUpdateObj.fieldObject = {};
		ipamODECtrl.aggrUpdateObj.aggrFieldObjectList = [];
		ipamODECtrl.aggrUpdateObj.rawCategoryViewList = [];
		ipamODECtrl.aggrUpdateObj.category = "";

		if(ipamODECtrl.aggrUpdateObj.isCategorySpecific === 'false')
		{
			ipamODECtrl.fetchODEFiledNameListForAggrUpdate(ipamODECtrl.aggrUpdateObj);
		}
		else
		{
			ipamODECtrl.fetchCategoryListForRawDataForAggrUpdate();
		}
	}


	ipamODECtrl.fetchCategoryListForRawDataForAggrUpdate=function(){

		var aggrUpdateObj = ipamODECtrl.aggrUpdateObj;

		var aggregationOn = aggrUpdateObj.aggregationOn;

		if(aggregationOn != 'RAW')
			return;

		var nodeName = aggrUpdateObj.nodeName;

		if(!nodeName)
			return;

		var queryString="operation=getCounterCategoryList";

		var header= {
			"username":$rootScope.globals.currentUser.username,
			"nodeName": nodeName
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT, header, queryString).then(
			function successCallback(response) {
				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.aggrUpdateObj.rawCategoryViewList = response.AppData.appdata.resultList;
					if(ipamODECtrl.aggrUpdateObj.rawCategoryViewList.length === 0) {
						ATOMService.showMessage('error','WARNING','Category List is empty ');
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Category List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.fetchFieldNameListForRawDataForAggrUpdate=function(){

		var aggrUpdateObj = ipamODECtrl.aggrUpdateObj;

		var aggregationOn = aggrUpdateObj.aggregationOn;

		if(aggregationOn != 'RAW')
			return;

		var nodeName = aggrUpdateObj.nodeName;

		if(!nodeName || !aggrUpdateObj.category)
			return;

		ipamODECtrl.aggrUpdateObj.aggrFieldObjectList = [];

		var queryString="operation=getCnaCommonFieldNames";

		var header = {
			"X-Flow-Id" : Date.now(),
			"username":$rootScope.globals.currentUser.username,
			"nodeName": nodeName
		};

		var finalObject = {
			"nodeName": nodeName,
			"isCategorySpecific": aggrUpdateObj.isCategorySpecific,
			"categoryList": [aggrUpdateObj.category]
		}

		ATOMCommonServices.commonPostMethod(finalObject,Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response){
				if( response.AppData.type == "SUCCESS"){

					ipamODECtrl.aggrUpdateObj.aggrFieldObjectList = response.AppData.appdata.resultList;

					if(ipamODECtrl.aggrUpdateObj.aggrFieldObjectList.length==0){
						ATOMService.showMessage('error','ERROR','Field Name List is empty. ');
					}
					else
					{
						if(typeof ipamODECtrl.aggrUpdateObj.aggrFieldObjectList[0] === 'string') {
							ipamODECtrl.aggrUpdateObj.aggrFieldObjectList = ipamODECtrl.aggrUpdateObj.aggrFieldObjectList.map(el => {return {fieldName: el};});
						}
					}
				}
				else {
					ATOMService.showMessage('error','ERROR','Unable to fetch Field Name List. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.fetchODEFiledValueListForAggrUpdate=function(aggr){

		if(!aggr.specific)
		{
			if(aggr.specificList)
				aggr.specificList = [];

			if(aggr.manualSpecificList)
				aggr.manualSpecificList = [];

			return;
		}

		var queryString = "operation=getAggregationFieldValueList";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"fieldName": aggr.fieldName
		};

		var aggregationOn = ipamODECtrl.aggrUpdateObj.aggregationOn;
		header.aggregationOn = aggregationOn;

		if(aggregationOn != 'HNA')
		{
			header.nodeName = ipamODECtrl.aggrUpdateObj.nodeName;
		}

		if(aggregationOn === 'RAW' && aggr.category)
		{
			header.Category = aggr.category;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					aggr.specificValueList = response.AppData.appdata.resultList;
					
					if(aggr.specificValueList.length === 0) {
						ATOMService.showMessage('error','WARNING','Specific List is empty');
						//aggr.specific = false;
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Specific List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.actionForAggrUpdateForODE=function(action, data){

		var aggrUpdateObj = ipamODECtrl.aggrUpdateObj;

		if(action === 'schChange')
		{

			ipamODECtrl.aggrUpdateObj.aggrFieldObjectList = [];
			ipamODECtrl.aggrUpdateObj.fieldObject = {};
			ipamODECtrl.aggrUpdateObj.fieldSize = null;

			ipamODECtrl.aggrUpdateObj.rawCategoryViewList = [];
			ipamODECtrl.aggrUpdateObj.category = "";
			ipamODECtrl.aggrUpdateObj.isCategorySpecific = "false";

			ipamODECtrl.aggrUpdateObj.aggrList = [];

			ipamODECtrl.fetchODEFiledNameListForAggrUpdate(ipamODECtrl.aggrUpdateObj);

		}
		else if(action === 'add')
		{
			if(!aggrUpdateObj.fieldObject || (!aggrUpdateObj.size && aggrUpdateObj.size !== 0))
				return;

			if(aggrUpdateObj.aggrList.length === 7)
			{
				ATOMService.showMessage('error','WARNING','Maximum 7 Aggregation Levels are allowed. ');
				return;
			}

			var existingAggIndex = aggrUpdateObj.aggrList.findIndex(el=> el.fieldName === aggrUpdateObj.fieldObject.fieldName);

			var aggr = {
				fieldName: aggrUpdateObj.fieldObject.fieldName,
				category: aggrUpdateObj.category ? aggrUpdateObj.category : "",
				size: aggrUpdateObj.size,
				specific: false,
				specificList: [],
				manualSpecificList: [],
				level: aggrUpdateObj.aggrList.length + 1
			};

			if(aggrUpdateObj.aggregationOn != 'HNA')
			{
				aggr.nodeName = aggrUpdateObj.nodeName;
			}

			if(existingAggIndex >= 0)
			{
				aggr.level = aggrUpdateObj.aggrList[existingAggIndex].level
				aggrUpdateObj.aggrList[existingAggIndex] = aggr;
			}
			else {
				aggrUpdateObj.aggrList.push(aggr);
			}

			aggrUpdateObj.fieldObject = null;
			aggrUpdateObj.size = null;

		}
		else if(action === 'delete')
		{
			elementIndexInArr = aggrUpdateObj.aggrList.findIndex(el => el === data);

			aggrUpdateObj.aggrList.splice(elementIndexInArr,1);

			var aggrLevel = 1;
			aggrUpdateObj.aggrList.map(el => { el.level = aggrLevel++; return el; });
		}
		else if(action === 'apply')
		{

			var finalObj = ipamODECtrl.finalData.find(item=> item.index === aggrUpdateObj.index);
			var networkElement = finalObj.networkElement;

			if(aggrUpdateObj.aggrList.length === 0 && networkElement.aggregationOperationType === 'hierachyBasedAggregation') {
				ATOMService.showMessage('error','WARNING','Please add atleast one Aggregation row while performing Hierarchy Based Aggregation. ');
				return;
			}

			/*if(networkElement.aggregationOn === 'HNA' && aggrUpdateObj.aggrList.length > 1) {
				ATOMService.showMessage('error','WARNING','Please add atmost one Aggregation row while performing aggregation on HNA. ');
				return;
			}*/

			if(aggrUpdateObj.aggrList && aggrUpdateObj.aggrList.length)
			{
				aggrUpdateObj.aggrList.forEach(aggr => {
					ipamODECtrl.prepareAndSyncSpecificList(aggr, true);
				});

				aggrUpdateObj.aggrList.forEach(el => {
					if(el.specific && (!el.manualSpecificList || !el.manualSpecificList.length)) {
						el.specific = false;
						el.specificList = [];
						el.manualSpecificList = [];
					}
				});
			}

			if(networkElement.aggregationOn != aggrUpdateObj.aggregationOn){
				delete networkElement.transposeFlag;
				delete networkElement.transposeJSON;
			}
			else if(networkElement.transposeFlag && networkElement.transposeJSON){
				var fieldIndex=aggrUpdateObj.aggrList.findIndex((el)=>el.fieldName===networkElement.transposeJSON.fieldName);
				if(fieldIndex===-1){
					delete networkElement.transposeFlag;
					delete networkElement.transposeJSON;
				}
				else{
					networkElement.transposeJSON.fieldPosition=fieldIndex;
				}
			}
			networkElement.aggregationOn = aggrUpdateObj.aggregationOn;
			networkElement.aggregationList.row = angular.copy(aggrUpdateObj.aggrList);

			if(aggrUpdateObj.executionType === 'MultipleProduct')
			{
				delete networkElement.tempNodeName;
			}

			if(networkElement.executionType === 'SingleProduct' && networkElement.attributes)
			{
				if( !(
					(networkElement.aggregationOperationType==='timeBasedAggregation'
						&& networkElement.aggregationList.row.length >= 1)
					||
					(networkElement.aggregationOperationType==='hierachyBasedAggregation'
						&& networkElement.headerPosition==='column'
						&& networkElement.aggregationList.row.length >= 1)
					||
					(networkElement.aggregationOperationType==='hierachyBasedAggregation'
							&& networkElement.headerPosition==='row'
							&& networkElement.aggregationList.row.length >= 2)
					)
				) {
					delete networkElement.attributes;
					delete networkElement.hideEmptyAttribute;
				}
			}

			delete networkElement.type;
			delete networkElement.opSequence;
			delete networkElement.currentAggregationOn;
			delete networkElement.typeAggregationOn;
			delete networkElement.furtherAggregationOn;
			delete networkElement.runtimeFilters;

			ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, aggrUpdateObj.index, 'aggregationChange');

			angular.element('#OdeAggrUpdate').modal('hide');
		}

	}


	ipamODECtrl.ruddSelectionActions=function(action, data) {

		if(action === 'OpenModal')
		{
			var finalObj = data;
			if(finalObj.requestId && $rootScope.streamingFlag)
			{
				ATOMService.showMessage('error','WARNING','You have to stop live stream in order to perform roll up/drill down. ');
				return;
			}

			var networkElement = finalObj.networkElement;

			ipamODECtrl.aggrChangeObj = {
				index : finalObj.index,
				category: "",
				isCategorySpecific: "false",
				fieldObject: null,
				size: null,
				executionType: networkElement.executionType,
				aggregationOn: networkElement.aggregationOn,
				currentAggregationOn: networkElement.currentAggregationOn ? networkElement.currentAggregationOn : networkElement.aggregationOn,
				nodeName: networkElement.nodeName,
				tempNodeName: networkElement.tempNodeName,
				opSequence: angular.copy(networkElement.opSequence)
			};

			ipamODECtrl.aggrChangeObj.aggrList = angular.copy(networkElement.aggregationList.row);

			if(ipamODECtrl.aggrChangeObj.opSequence && ipamODECtrl.aggrChangeObj.opSequence.length >= 2)
			{
				ipamODECtrl.aggrChangeObj.aggrList = ipamODECtrl.aggrChangeObj.aggrList.map(el => {
					el.specific = false;
					el.specificList = [];
					el.manualSpecificList = [];
					return el;
				});
			}

			if(ipamODECtrl.aggrChangeObj.opSequence && ipamODECtrl.aggrChangeObj.opSequence.length === 2
				&& (ipamODECtrl.aggrChangeObj.aggregationOn === 'HNA' && ['SNA','CNA'].includes(ipamODECtrl.aggrChangeObj.currentAggregationOn)))
			{
				ipamODECtrl.getSnaFieldNameListForRUDDSelection(ipamODECtrl.aggrChangeObj);
			}

			angular.element('#OdeRUDDSelectionModal').modal('show');

		}
		else if (action === 'Add')
		{

			var aggrChangeObj = ipamODECtrl.aggrChangeObj;

			if(!aggrChangeObj.fieldObject || (!aggrChangeObj.size && aggrChangeObj.size !== 0))
				return;

			if(aggrChangeObj.aggrList.length === 7)
			{
				ATOMService.showMessage('error','WARNING','Maximum 7 Aggregation Levels are allowed. ');
				return;
			}

			var existingAggIndex = aggrChangeObj.aggrList.findIndex(el=> el.fieldName === aggrChangeObj.fieldObject.fieldName);

			var aggr = {
				fieldName: aggrChangeObj.fieldObject.fieldName,
				category: aggrChangeObj.category ? aggrChangeObj.category : "",
				size: aggrChangeObj.size,
				specific: false,
				specificList: [],
				manualSpecificList: [],
				level: aggrChangeObj.aggrList.length + 1
			};

			if(aggrChangeObj.executionType === 'SingleProduct' && aggrChangeObj.currentAggregationOn != 'HNA')
			{
				aggr.nodeName = aggrChangeObj.nodeName;
			}
			else if(aggrChangeObj.executionType === 'MultipleProduct'
				&& aggrChangeObj.opSequence && aggrChangeObj.opSequence.length == 2
				&& (aggrChangeObj.aggregationOn === 'HNA' && ['SNA','CNA'].includes(aggrChangeObj.currentAggregationOn)))
			{
				aggr.nodeName = aggrChangeObj.fieldObject.nodeName;
			}
			else if(aggrChangeObj.executionType === 'MultipleProduct' && aggrChangeObj.currentAggregationOn != 'HNA')
			{
				aggr.nodeName = aggrChangeObj.tempNodeName;
			}

			if(existingAggIndex >= 0)
			{
				aggr.level = aggrChangeObj.aggrList[existingAggIndex].level
				aggrChangeObj.aggrList[existingAggIndex] = aggr;
			}
			else {
				aggrChangeObj.aggrList.push(aggr);
			}

			aggrChangeObj.fieldObject = null;
			aggrChangeObj.size = null;
		}
	}


	ipamODECtrl.getSnaFieldNameListForRUDDSelection=function(aggrChangeObj){

		var finalObj = ipamODECtrl.finalData.find(item=> item.index === ipamODECtrl.aggrChangeObj.index);
		var networkElement = finalObj.networkElement;

		var queryString = "operation=getSnaFieldNameListForHnaValue";

		var	header = {
			"username": $rootScope.globals.currentUser.username,
			"hnaFieldName": networkElement.runtimeFilters.slice(-1)[0].fieldName,
			"hnaValue": networkElement.runtimeFilters.slice(-1)[0].manualSpecificList[0]
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					ipamODECtrl.aggrFieldObjectList = response.AppData.appdata.resultList;

					if(aggrChangeObj.currentAggregationOn === 'CNA')
					{
						ipamODECtrl.aggrFieldObjectList = ipamODECtrl.aggrFieldObjectList.filter(el =>
						el.createdBy === aggrChangeObj.currentAggregationOn.toLowerCase());
					}
					else if(aggrChangeObj.currentAggregationOn === 'SNA')
					{
						ipamODECtrl.aggrFieldObjectList = ipamODECtrl.aggrFieldObjectList.filter(el =>
						el.createdBy != 'cna');
					}

					if(!ipamODECtrl.aggrFieldObjectList || ipamODECtrl.aggrFieldObjectList.length === 0)
					{
						ATOMService.showMessage('error','WARNING','Field Name List is Empty. ');
					} else
					{
						ipamODECtrl.aggrFieldObjectList = ipamODECtrl.aggrFieldObjectList.map(el => {el.fieldName = el.snaFieldName; return el;});
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Field Field List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.fetchAggrApplicability=function(action){

		ipamODECtrl.ruddObj.allowHNA = true;
		ipamODECtrl.ruddObj.allowSNA = true;
		ipamODECtrl.ruddObj.allowCNA = true;
		ipamODECtrl.ruddObj.allowRAW = true;

		if(action === 'drillDown' && ['HNA','SNA','CNA'].includes(ipamODECtrl.ruddObj.currentAggregationOn))
		{
			var queryString = "operation=validateHnaSnaCnaRawCheckbox";

			var	header = {
				"username": $rootScope.globals.currentUser.username,
				"aggregationOn": ipamODECtrl.ruddObj.currentAggregationOn,
				"fieldName": ipamODECtrl.ruddObj.aggregationOnObj.fieldName
			};

			ATOMCommonServices.commonGetMethod(Constants.IPAM_CRUD_CONTEXT,header,queryString).then(
				function successCallback(response) {

					if(response.AppData.type == "SUCCESS")
					{
						ipamODECtrl.ruddObj.allowHNA = !!response.AppData.appdata.HNA;
						ipamODECtrl.ruddObj.allowSNA = !!response.AppData.appdata.SNA;
						ipamODECtrl.ruddObj.allowCNA = !!response.AppData.appdata.CNA;
						ipamODECtrl.ruddObj.allowRAW = !!response.AppData.appdata.RAW;
					}
					else
					{
						console.log('Unable to fetch applicability details');
					}
				},
				function errorCallback(responseData){
					console.log('Unable to fetch applicability details, server is not reachable');
			});
		}
	}


	ipamODECtrl.rollUpDrillDownForODE=function(action, data){

		if(action === 'rollUp' || action === 'drillDown')
		{

			var operation = action;

			var aggrChangeObj = ipamODECtrl.aggrChangeObj; // contains aggregationOn and executionType
			var aggregationOnIndex = aggrChangeObj.aggrList.findIndex(el => el === data); // aggregation list row index on which rollup/drilldown performed
			var aggregationOnObj = angular.copy(aggrChangeObj.aggrList[aggregationOnIndex]); // aggregation Object on which rollup/drilldown performed
			aggregationOnObj.specific = true;
			aggregationOnObj.specificList = [];
			aggregationOnObj.manualSpecificList = [];

			var finalObj = ipamODECtrl.finalData.find(item=> item.index === aggrChangeObj.index);
			var networkElement = finalObj.networkElement;
			networkElement.opSequence = (networkElement.opSequence && networkElement.opSequence.length) ? networkElement.opSequence : [{operation: '', aggregation: aggrChangeObj.aggregationOn}];
			opSequence = networkElement.opSequence;

			var furtherAggregationOn = ipamODECtrl.getRollUpDrillDownSequenceForODE(operation, aggrChangeObj);

			if(!furtherAggregationOn)
				return;

			ipamODECtrl.ruddObj = {
				aggrChangeObj: angular.copy(aggrChangeObj),
				aggregationOn: aggrChangeObj.aggregationOn,

				aggregationOnObj: aggregationOnObj,
				operation: operation,
				currentAggregationOn: aggrChangeObj.currentAggregationOn ? aggrChangeObj.currentAggregationOn : aggrChangeObj.aggregationOn,
				furtherAggregationOn: furtherAggregationOn,

				furtherFieldObject: null,
				furtherFieldSize: "",
				furtherFieldObjectList: [],

				aggregationOnFieldNameList: [],
				aggregationOnFieldValue: "", 
				aggregationOnFieldValueList: [],

				aggregationList: [],
				aggregationListEditIndex: -1,

				opSequence: opSequence,
				prePopulateFlg: false
			}

			var ruddObj = ipamODECtrl.ruddObj;

			ruddObj.aggregationOnObj.fieldObj = {};

			if(ruddObj.aggrChangeObj.executionType === 'MultipleProduct'
				&& ruddObj.opSequence && ruddObj.opSequence.length == 2
				&& (ruddObj.aggregationOn === 'HNA' && ['SNA','CNA'].includes(ruddObj.currentAggregationOn)))
			{
				//set temp node name
				ruddObj.aggrChangeObj.tempNodeName = ruddObj.aggregationOnObj.nodeName;
			}

			if(operation === 'rollUp')
			{
				if(opSequence.length >= 2 && opSequence.slice(-1)[0].operation === 'drillDown')
				{
					ipamODECtrl.ruddObj.prePopulateFlg = true;
					var runtimeFilter = networkElement.runtimeFilters.slice(-1).pop();

					var furtherAggregationObj = {
						fieldName: runtimeFilter.fieldName,
						category: runtimeFilter.category ? runtimeFilter.category : "",
						size: 25,
						specific: false,
						level: 1,
						specificList: [],
						manualSpecificList:[],
						specificValueList: []
					};

					if(ruddObj.furtherAggregationOn != 'HNA')
					{
						if(ruddObj.aggrChangeObj.executionType === 'SingleProduct')
						{
							furtherAggregationObj.nodeName = ruddObj.aggrChangeObj.nodeName;
						}
						else if(ruddObj.aggrChangeObj.executionType === 'MultipleProduct')
						{
							furtherAggregationObj.nodeName = ruddObj.aggrChangeObj.tempNodeName;
						}
					}

					ruddObj.aggregationList = [furtherAggregationObj];

					if(furtherAggregationObj.specific)
					{
						ipamODECtrl.rollUpDrillDownForODE('specificChange',{index: 0});
					}

				}
			}

			ipamODECtrl.fetchAggrApplicability(action);
			angular.element('#modalForRollUpDrillDown').modal('show');
		}
		else if(action === 'add')
		{
			var ruddObj = ipamODECtrl.ruddObj;
			var aggrChangeObj = ruddObj.aggrChangeObj;

			if(!ruddObj.furtherFieldObject || (!ruddObj.furtherFieldSize && ruddObj.furtherFieldSize !== 0))
				return;

			if(ruddObj.aggregationList.length === 7)
			{
				ATOMService.showMessage('error','WARNING','Maximum 7 Aggregation Levels are allowed. ');
				return;
			}

			var furtherAggregationObj = {
				fieldName: ruddObj.furtherFieldObject.snaFieldName,
				category: "",
				size: ruddObj.furtherFieldSize,
				specific: false,
				level: 1,
				specificList: [],
				manualSpecificList: [],
				specificValueList: []
			};

			if(!furtherAggregationObj.fieldName || (!furtherAggregationObj.size && furtherAggregationObj.size !== 0))
				return;

			var existingAggIndex = ruddObj.aggregationList.findIndex(el=> el.fieldName === furtherAggregationObj.fieldName);

			if(existingAggIndex >= 0){
				ATOMService.showMessage('error','WARNING','Field already added in Aggregation. ');
				return;
			}

			if(aggrChangeObj.furtherAggregationOn != 'HNA')
			{
				if(aggrChangeObj.executionType === 'SingleProduct')
				{
					furtherAggregationObj.nodeName = aggrChangeObj.nodeName;
				}
				else if(aggrChangeObj.executionType === 'MultipleProduct')
				{
					furtherAggregationObj.nodeName = aggrChangeObj.tempNodeName;
				}
			}

			ruddObj.aggregationList.push(furtherAggregationObj);

			ruddObj.furtherFieldObject = null;
			ruddObj.furtherFieldSize = null;

		}
		else if(action === 'delete')
		{
			ipamODECtrl.ruddObj.aggregationList.splice(data.index,1);
		}
		else if(action === 'specificChange')
		{
			var ruddObj = ipamODECtrl.ruddObj;

			ruddObj.aggregationListEditIndex = data.index;

			var aggr = ruddObj.aggregationList[data.index];

			if(!aggr.specific)
			{
				if(aggr.specificList)
					aggr.specificList = [];

				if(aggr.manualSpecificList)
					aggr.manualSpecificList = [];

				return;
			}
			else {
				aggr.specificValueList = [];
				ipamODECtrl.getFurtherAggrFieldValueListForODE(ipamODECtrl.ruddObj);
			}
		}
		else if(action === 'aggrRadioSelection')
		{
			// Populates field name list and field value list

			var ruddObj = ipamODECtrl.ruddObj;

			if(!["HNA","SNA","CNA","RAW"].includes(ruddObj.furtherAggregationOn))
				return;

			ruddObj.aggregationList = [];

			if(ruddObj.currentAggregationOn === 'HNA')
			{
				//drillDown from HNA
				ruddObj.aggregationOnFieldValueList = [];
				ipamODECtrl.getAggregationOnFieldValueListForODE(ruddObj);
			}
			else if(
				(ruddObj.currentAggregationOn === 'SNA' && ruddObj.furtherAggregationOn === 'HNA')
				||
				(ruddObj.currentAggregationOn === 'CNA' && ruddObj.furtherAggregationOn === 'HNA')
				||
				(ruddObj.currentAggregationOn === 'RAW' && ruddObj.furtherAggregationOn === 'SNA')
				||
				(ruddObj.currentAggregationOn === 'RAW' && ruddObj.furtherAggregationOn === 'CNA')
			)
			{
				// fetch field name list for roll up
				ipamODECtrl.getFieldNameListWithFilterForODE(ruddObj);
			}
			else if(
				(ruddObj.currentAggregationOn === 'SNA' && ruddObj.furtherAggregationOn === 'SNA')
				||
				(ruddObj.currentAggregationOn === 'SNA' && ruddObj.furtherAggregationOn === 'CNA')
				||
				(ruddObj.currentAggregationOn === 'CNA' && ruddObj.furtherAggregationOn === 'SNA')
				||
				(ruddObj.currentAggregationOn === 'CNA' && ruddObj.furtherAggregationOn === 'CNA')
				||
				(ruddObj.currentAggregationOn === 'SNA' && ruddObj.furtherAggregationOn === 'RAW')
				||
				(ruddObj.currentAggregationOn === 'CNA' && ruddObj.furtherAggregationOn === 'RAW')
			)
			{
				// fetch field name list for roll up
				ipamODECtrl.getFieldNameListWithFilterForODE(ruddObj);

				ruddObj.aggregationOnFieldValueList = [];
				ipamODECtrl.getAggregationOnFieldValueListForODE(ruddObj);
			}

		}
		else if(action === 'apply')
		{

			var ruddObj = ipamODECtrl.ruddObj;
			var finalObj = ipamODECtrl.finalData.find(item=> item.index === ruddObj.aggrChangeObj.index);
			var networkElement = finalObj.networkElement;
			var runtimeFilters = networkElement.runtimeFilters ? networkElement.runtimeFilters : [];

			if(!["HNA","SNA","CNA","RAW"].includes(ruddObj.furtherAggregationOn))
			{
				return;
			}

			if(ruddObj.operation === 'drillDown') {

				var valueListArray = [ruddObj.aggregationOnFieldValue];

				var runTimeFilter = {"fieldName": ruddObj.aggregationOnObj.fieldName,"specificList": valueListArray, manualSpecificList: valueListArray};

				if(ruddObj.currentAggregationOn != 'HNA')
				{
					if(ruddObj.aggrChangeObj.executionType === 'SingleProduct')
					{
						runTimeFilter.nodeName = ruddObj.aggrChangeObj.nodeName;
					}
					else if(ruddObj.aggrChangeObj.executionType === 'MultipleProduct')
					{
						runTimeFilter.nodeName = ruddObj.aggrChangeObj.tempNodeName;
					}
				}

				runtimeFilters.push(runTimeFilter);

				if(!ruddObj.aggregationOnFieldValue) {
					ATOMService.showMessage('error','WARNING','Please select Value for Field ' + ruddObj.aggregationOnObj.fieldName);
					return;
				}

				if(ruddObj.currentAggregationOn === 'SNA' || ruddObj.currentAggregationOn === 'CNA')
				{
					if(ruddObj.aggregationList.length === 0) {
						ATOMService.showMessage('error','WARNING','Please add atleast one Aggregation row while performing ' + (ruddObj.operation === 'rollUp' ? 'Roll Up': 'Drill Down'));
						return;
					}
				}

				if(
					(ruddObj.currentAggregationOn === 'HNA' && ruddObj.furtherAggregationOn === 'SNA' )
					||
					(ruddObj.currentAggregationOn === 'HNA' && ruddObj.furtherAggregationOn === 'CNA' )
				)
				{
					ruddObj.aggregationList = [];
				}

				ruddObj.aggregationOnObj.specific = true;
				ruddObj.aggregationOnObj.specificList = [ruddObj.aggregationOnFieldValue];
				ruddObj.aggregationOnObj.manualSpecificList = [ruddObj.aggregationOnFieldValue];

			}

			else if(ruddObj.operation === 'rollUp')
			{
				/*if(ruddObj.furtherAggregationOn === 'HNA' && ruddObj.aggregationList.length > 1)
				{
					ATOMService.showMessage('error','WARNING','Please add atmost one Aggregation row while performing aggregation on HNA. ');
					return;
				}*/

				if(ruddObj.aggregationList.length === 0) {
					ATOMService.showMessage('error','WARNING','Please add atleast one Aggregation row while performing ' + (ruddObj.operation === 'rollUp' ? 'Roll Up': 'Drill Down'));
					return;
				}

				if(networkElement.runtimeFilters && networkElement.runtimeFilters.length)
					networkElement.runtimeFilters.pop();

				if(
					['SNA','CNA'].includes(ruddObj.aggregationOn)
					&& ['SNA','CNA'].includes(ruddObj.currentAggregationOn)
					&& ruddObj.furtherAggregationOn === 'HNA'
				)
				{

					if(ruddObj.aggregationList.length === 0) {
						ATOMService.showMessage('error','WARNING','Please add atleast one Aggregation row while performing ' + (ruddObj.operation === 'rollUp' ? 'Roll Up': 'Drill Down'));
						return;
					}

					ruddObj.aggregationOn === 'HNA';
					networkElement.aggregationOn = 'HNA';
					networkElement.opSequence = [];
					runtimeFilters = [];
				}
				else if(
					ruddObj.aggregationOn === 'RAW'
					&& ruddObj.currentAggregationOn === 'RAW'
					&& ['SNA','CNA'].includes(ruddObj.furtherAggregationOn))
				{
					if(ruddObj.aggregationList.length === 0) {
						ATOMService.showMessage('error','WARNING','Please add atleast one Aggregation row while performing ' + (ruddObj.operation === 'rollUp' ? 'Roll Up': 'Drill Down'));
						return;
					}

					ruddObj.aggregationOn === ruddObj.furtherAggregationOn;
					networkElement.aggregationOn = ruddObj.furtherAggregationOn;
					networkElement.opSequence = [];
					runtimeFilters = [];
				}

			}


			if(ruddObj.aggregationList && ruddObj.aggregationList.length)
			{
				ruddObj.aggregationList.forEach(aggr => {
					ipamODECtrl.prepareAndSyncSpecificList(aggr, true);
				});

				ruddObj.aggregationList.forEach(el => {
					if(el.specific && (!el.manualSpecificList || !el.manualSpecificList.length)) {
						el.specific = false;
						el.specificList = [];
						el.manualSpecificList = [];
					}
				});
			}

			if(ruddObj.aggrChangeObj.executionType === 'MultipleProduct')
			{
				if(ruddObj.furtherAggregationOn === 'HNA')
					delete networkElement.tempNodeName;
				else if(ruddObj.aggrChangeObj.executionType === 'MultipleProduct'
					&& ruddObj.aggrChangeObj.opSequence && ruddObj.aggrChangeObj.opSequence.length == 2
					&& (ruddObj.aggregationOn === 'HNA' && ['SNA','CNA'].includes(ruddObj.currentAggregationOn)))
					networkElement.tempNodeName = ruddObj.aggrChangeObj.tempNodeName;
			}

			networkElement.aggregationList.row = ruddObj.aggregationList;
			networkElement.type = ruddObj.operation;
			networkElement.runtimeFilters = runtimeFilters;
			networkElement.currentAggregationOn = ruddObj.furtherAggregationOn;
			networkElement.typeAggregationOn = ruddObj.furtherAggregationOn;

			var opSequence = networkElement.opSequence ? networkElement.opSequence : [{operation: '', aggregation: ruddObj.aggregationOn}];

			if(ruddObj.operation === 'drillDown')
			{
				opSequence.push({operation: 'drillDown', aggregation: ruddObj.furtherAggregationOn});
			}
			else if(ruddObj.operation === 'rollUp')
			{
				opSequence.pop();
			}

			if(networkElement.executionType === 'SingleProduct' && networkElement.attributes)
			{

				if( !(
					(networkElement.aggregationOperationType==='timeBasedAggregation'
						&& networkElement.aggregationList.row.length >= 1)
					||
					(networkElement.aggregationOperationType==='hierachyBasedAggregation'
						&& networkElement.headerPosition==='column'
						&& networkElement.aggregationList.row.length >= 1)
					||
					(networkElement.aggregationOperationType==='hierachyBasedAggregation'
							&& networkElement.headerPosition==='row'
							&& networkElement.aggregationList.row.length >= 2)
					)
				) {
					delete networkElement.attributes;
					delete networkElement.hideEmptyAttribute;
				}
			}

			ipamODECtrl.fetchODEResult(ipamODECtrl.finalData, ruddObj.aggrChangeObj.index, 'rollUpDrillDown');

			angular.element('#modalForRollUpDrillDown').modal('hide');
			angular.element('#OdeRUDDSelectionModal').modal('hide');
		}

	}


	ipamODECtrl.getRollUpDrillDownSequenceForODE=function(operation, data){

		var finalObj = ipamODECtrl.finalData.find(item=> item.index === data.index);
		var networkElement = finalObj.networkElement;
		var opSequence = networkElement.opSequence;

		if(operation === 'rollUp')
		{

			if(data.currentAggregationOn === 'HNA') {
				ATOMService.showMessage('error','WARNING',"Roll Up operation can't be performed on HNA. ");
				return "";
			}
			else if(data.currentAggregationOn === 'SNA' || data.currentAggregationOn === 'CNA')
			{
				if(opSequence.length >= 2 && opSequence.slice(-1)[0].operation === 'drillDown')
					return opSequence.slice(-2,-1)[0].aggregation;
				else
					return "HNA OR SNA OR CNA";
			}
			else if(data.currentAggregationOn === 'RAW')
			{
				if(opSequence.length >= 2 && opSequence.slice(-1)[0].operation === 'drillDown')
					return opSequence.slice(-2,-1)[0].aggregation;
				else
					return "SNA OR CNA";
			}
		}
		else if (operation === 'drillDown')
		{

			if(data.currentAggregationOn === 'HNA') {
				return "SNA OR CNA";
			}
			else if(data.currentAggregationOn === 'SNA' || data.currentAggregationOn === 'CNA') {
				return "SNA OR CNA OR RAW";
			}
			else if(data.currentAggregationOn === 'RAW') {
				ATOMService.showMessage('error','WARNING',"Drill Down operation can't be performed on RAW. ");
				return "";
			}
		}
	}


	ipamODECtrl.getAggregationOnFieldValueListForODE=function(data){

		var queryString = "operation=getAggregationFieldValueList";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"aggregationOn": data.currentAggregationOn,
			"fieldName": data.aggregationOnObj.fieldName,
			"type": data.furtherAggregationOn.toLowerCase()
		};

		if(data.currentAggregationOn != 'HNA') {
			if(data.aggrChangeObj.executionType === 'SingleProduct')
				header.nodeName = data.aggrChangeObj.nodeName;
			else if(data.aggrChangeObj.executionType === 'MultipleProduct')
				header.nodeName = data.aggrChangeObj.tempNodeName;
		}

		if(data.currentAggregationOn === 'RAW' && data.aggregationOnObj.category)
		{
			header.Category = data.aggregationOnObj.category;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					data.aggregationOnFieldValueList = response.AppData.appdata.resultList;

					if(data.aggregationOnFieldValueList.length === 0) {
						ATOMService.showMessage('error','WARNING','Specific Value List is empty for Field ' + data.aggregationOnObj.fieldName);
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Specific List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.getFieldNameListWithFilterForODE=function(data){ /// second panel field name list

		if(!data.aggregationOn || !data.furtherAggregationOn || !data.aggregationOnObj.fieldName || !data.operation)
			return;

		var queryString = "operation=getAggregationFieldNameListWithFilter";

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"aggregationOn": data.currentAggregationOn,
			"furtherAggregationOn": data.furtherAggregationOn,
			"operationType": data.operation,
			"fieldName": data.aggregationOnObj.fieldName
		};

		if((data.operation === 'rollUp' && data.furtherAggregationOn === 'HNA') || (data.furtherAggregationOn != 'HNA'))
		{
			if(data.aggrChangeObj.executionType === 'SingleProduct')
				header.nodeName = data.aggrChangeObj.nodeName;
			else if(data.aggrChangeObj.executionType === 'MultipleProduct')
				header.nodeName = data.aggrChangeObj.tempNodeName;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(

			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					data.furtherFieldObjectList = response.AppData.appdata.resultList;

					if(!data.furtherFieldObjectList || data.furtherFieldObjectList.length === 0)
					{
						ATOMService.showMessage('error','WARNING','Field Name List is Empty. ');
					}
					else {
						if(typeof data.furtherFieldObjectList[0] === 'string') {
							data.furtherFieldObjectList = data.furtherFieldObjectList.map(el => {return {snaFieldName: el};});
						}
					}
				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch Field Name List. Please contact admin. ');
				}
			},
			function errorCallback(responseData) {
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

	}


	ipamODECtrl.getFurtherAggrFieldValueListForODE=function(data){ // second panel specific field value list

		var aggr = data.aggregationList[data.aggregationListEditIndex];

		var queryString = "operation=getAggregationFieldValueList";

		var	header = {
			"username": $rootScope.globals.currentUser.username,
			"aggregationOn": data.furtherAggregationOn,
			"fieldName": aggr.fieldName
		};

		if(data.furtherAggregationOn != 'HNA') {
			header.nodeName = aggr.nodeName;
		}

		if(data.furtherAggregationOn === 'RAW' && aggr.category) {
			header.Category = aggr.category;
		}

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {

					aggr.specificValueList = response.AppData.appdata.resultList;
					
					

					if(aggr.specificValueList.length === 0) {
						ATOMService.showMessage('error','WARNING','Specific Value List is empty for Field ' + aggr.fieldName);
					}
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Specific List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.getSnaFieldListForODE=function(){ // HNA SNA RAW CASE => second panel sna field name list/ value list and furtherAggregationFieldNameList

		var ruddObj = ipamODECtrl.ruddObj;
		var finalObj = ipamODECtrl.finalData.find(item=> item.index === ruddObj.aggrChangeObj.index);
		var networkElement = finalObj.networkElement;

		var queryString = "operation=getSnaFieldNameListForHnaValue";

		var	header = {
			"username": $rootScope.globals.currentUser.username,
			"hnaFieldName": networkElement.runtimeFilters.slice(-1)[0].fieldName,
			"hnaValue": networkElement.runtimeFilters.slice(-1)[0].manualSpecificList[0]
		};

		ATOMCommonServices.commonGetMethod(Constants.IPAM_COUNTER_CONTEXT,header,queryString).then(
			function successCallback(response) {

				if( response.AppData.type == "SUCCESS") {
					ruddObj.aggregationOnFieldObjList = response.AppData.appdata.resultList;
				}
				else
				{
					ATOMService.showMessage('error','WARNING','Unable to fetch Field SNA Field List. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.executeAndDownloadExcel=function(action, data){

		if(action === 'openModal') {

			if($rootScope.streamingFlag) {
				ATOMService.showMessage('error','WARNING','You have to stop live stream in order to perform the action. ');
				return;
			}

			if($scope.odeeadeform) {
				$scope.odeeadeform.$setUntouched();
				$scope.odeeadeform.$setPristine();
			}

			var elementIndexInArr = ipamODECtrl.networkElementList.findIndex(el => el === data);
			var networkElement = angular.copy(ipamODECtrl.networkElementList[elementIndexInArr]);

			if(networkElement.aggregationList.row.some(aggr=> aggr.size > 100000)){
				ATOMService.showMessage('error','Invalid Aggregation Details','Aggregation size value exceeds 100000 limit.');
				return;
			}

			ipamODECtrl.excelForm = {hourInput: [], quarterInput: [], quarterComboList: ipamODECtrl._.range(0,59,5), selectiveDatesModel: ""};
			ipamODECtrl.excelForm.networkElement = networkElement;

			ipamODECtrl.excelForm.timeSelectionType = ipamODECtrl.excelForm.networkElement.timeSelectionType;

			if(!ipamODECtrl.excelForm.timeSelectionType)
			{
				if(ipamODECtrl.excelForm.networkElement.aggregationOperationType === 'timeBasedAggregation')
					ipamODECtrl.excelForm.timeSelectionType = 'TimeBuckets';
				else
					ipamODECtrl.excelForm.timeSelectionType = '';
			}

			ipamODECtrl.excelForm.fileName = networkElement.dashboardName ? networkElement.dashboardName: "";
			ipamODECtrl.excelForm.fileFormat = networkElement.fileFormat ? networkElement.fileFormat: "excel";
			ipamODECtrl.excelForm.networkDayDiff = networkElement.networkDayDiff;
			ipamODECtrl.excelForm.startTime = networkElement.startTime ? networkElement.startTime : "";
			ipamODECtrl.excelForm.endTime = networkElement.endTime  ? networkElement.endTime : "";
			ipamODECtrl.excelForm.selectiveDates = networkElement.selectiveDates ? networkElement.selectiveDates : [];
			ipamODECtrl.excelForm.bucketType = networkElement.bucketType ? networkElement.bucketType : "";
			ipamODECtrl.excelForm.bucketSize = networkElement.bucketSize ? networkElement.bucketSize : "";
			ipamODECtrl.excelForm.numberOfBucket = networkElement.numberOfBucket;
			ipamODECtrl.excelForm.hourList = networkElement.hourList ? networkElement.hourList : [];

			ipamODECtrl.excelForm.bucketSizeList = [];

			if(['Minutes'].includes(ipamODECtrl.excelForm.bucketType))
			{
				ipamODECtrl.excelForm.bucketSizeList = angular.copy(ipamODECtrl.setupBasedBucketSizeList);
				ipamODECtrl.excelForm.quarterComboList = ipamODECtrl._.range(0,59,networkElement.bucketSize);
			}
			else if(['Hours'].includes(ipamODECtrl.excelForm.bucketType))
			{
				ipamODECtrl.excelForm.bucketSizeList = [1];
				ipamODECtrl.excelForm.quarterComboList = ipamODECtrl._.range(0,59,15);
			}
			else if(ipamODECtrl.excelForm.bucketType)
			{
				ipamODECtrl.excelForm.bucketSizeList = [1];
			}

			if(networkElement.customTimeRange)
			{
				ipamODECtrl.excelForm.customTimeRange = networkElement.customTimeRange;
			}
			else
			{
				ipamODECtrl.excelForm.customTimeRange = {
					filterType: null,
					customBucketSize: null,
					customBucketType: null
				};
			}

			ipamODECtrl.setAttributesForExecution(networkElement, 0);

			// start time and end time
			ipamODECtrl.resetExcelDate();

			try {
				$timeout(function(){

					ipamODECtrl.excelForm.startTime = ipamODECtrl.setZeroTimePart('remove',networkElement,networkElement.startTime);
					ipamODECtrl.excelForm.endTime = ipamODECtrl.setZeroTimePart('remove',networkElement,networkElement.endTime);

					if($('#odedatetimepickerexcelstart').data("DateTimePicker"))
					{
						$('#odedatetimepickerexcelstart').data("DateTimePicker").date(ipamODECtrl.excelForm.startTime);
						$('#odedatetimepickerexcelend').data("DateTimePicker").date(ipamODECtrl.excelForm.endTime);
					}
				},1000);
			} catch (e){
				console.error(e);
			}

			angular.element('#modalForExecuteAndDownloadExcel').modal('show');
		}
		else if(action === 'FilterTypeChange')
		{
			if(ipamODECtrl.excelForm.timeSelectionType === "timeInterval")
			{
				ipamODECtrl.excelForm.numberOfBucket = null;
			}

			ipamODECtrl.excelForm.selectiveDates = [];
			ipamODECtrl.excelForm.selectiveDatesModel = "";
		}
		else if(action === 'CustomFilterTypeChange')
		{
			ipamODECtrl.excelForm.customTimeRange.customBucketSize = null;
			ipamODECtrl.excelForm.customTimeRange.customBucketType = null;
		}
		else if(action === 'BucketTypeChange')
		{
			ipamODECtrl.excelForm.hourInput = [];
			ipamODECtrl.excelForm.hourList = [];
			ipamODECtrl.excelForm.quarterInput = [];
			ipamODECtrl.excelForm.quarterComboList = [];

			if(!ipamODECtrl.excelForm.bucketType) {
				ipamODECtrl.excelForm.bucketSize = "";
				ipamODECtrl.excelForm.bucketSizeList = [];
			}
			else {
				if(['Minutes'].includes(ipamODECtrl.excelForm.bucketType))
				{
					ipamODECtrl.excelForm.bucketSize = "";
					ipamODECtrl.excelForm.bucketSizeList = angular.copy(ipamODECtrl.setupBasedBucketSizeList);
				}
				else if(['Hours'].includes(ipamODECtrl.excelForm.bucketType))
				{
					ipamODECtrl.excelForm.quarterComboList = ipamODECtrl._.range(0,59,15);
					ipamODECtrl.excelForm.bucketSize = 1;
					ipamODECtrl.excelForm.bucketSizeList = [1];
				}
				else
				{
					ipamODECtrl.excelForm.bucketSize = 1;
					ipamODECtrl.excelForm.bucketSizeList = [1];
				}
			}
		}
		else if(action === 'BucketSizeChange')
		{
			if(['Minutes'].includes(ipamODECtrl.excelForm.bucketType))
			{
				ipamODECtrl.excelForm.hourInput = [];
				ipamODECtrl.excelForm.hourList = [];
				ipamODECtrl.excelForm.quarterInput = [];
				ipamODECtrl.excelForm.quarterComboList = ipamODECtrl._.range(0,59,ipamODECtrl.excelForm.bucketSize);
			}
		}
		else if(action === 'addAll')
		{
			ipamODECtrl.excelForm.hourInput = ipamODECtrl._.range(24);
		}
		else if(action === 'removeAll')
		{
			ipamODECtrl.excelForm.hourInput = [];
		}
		else if(action === 'addAllQuarters')
		{
			ipamODECtrl.excelForm.quarterInput = angular.copy(ipamODECtrl.excelForm.quarterComboList);
		}
		else if(action === 'removeAllQuarters')
		{
			ipamODECtrl.excelForm.quarterInput = [];
		}
		else if(action === 'addToHourListTable')
		{
			ipamODECtrl.excelForm.hourInput.forEach(hour=> {
				ipamODECtrl.excelForm.quarterInput.forEach(quarter=> {
					if(!ipamODECtrl.excelForm.hourList.find(el => el.hour === hour && el.minute === quarter))
					{
						ipamODECtrl.excelForm.hourList.push({'hour': hour, 'minute': quarter});
					}
				})
			})
			ipamODECtrl.excelForm.hourInput = [];
			ipamODECtrl.excelForm.quarterInput = [];
			ipamODECtrl.sortHourArr(ipamODECtrl.excelForm.hourList);
		}
		else if(action === 'addAllToHourListTable')
		{
			ipamODECtrl.excelForm.hourList = [];
			ipamODECtrl._.range(24).forEach(hour=> {
				ipamODECtrl.excelForm.quarterComboList.forEach(quarter=> {
					ipamODECtrl.excelForm.hourList.push({'hour': hour, 'minute': quarter});
				});
			})
			ipamODECtrl.excelForm.hourInput = [];
			ipamODECtrl.excelForm.quarterInput = [];
			ipamODECtrl.sortHourArr(ipamODECtrl.excelForm.hourList);
		}
		else if(action === 'clearHourListTable')
		{
			ipamODECtrl.excelForm.hourList = [];
		}
		else if(action === 'addAllHourstoHourList')
		{
			ipamODECtrl._.range(24).forEach(hour=> {
				ipamODECtrl.excelForm.hourList.push(hour);
			})
		}
		else if(action === 'removeAllHoursfromHourList')
		{
			ipamODECtrl.excelForm.hourList = [];
		}
		else if(action === 'deleteFromHourListTable')
		{
			var deleteIndex = ipamODECtrl.excelForm.hourList.findIndex(el => el === data);
			ipamODECtrl.excelForm.hourList.splice(deleteIndex, 1);
		}
		else if(action === 'apply') {

			ipamODECtrl.downloadReportAsExcel(true);
		}
	}


	ipamODECtrl.selectiveDatesExcelFn=function(action,date=null){
		if(action === 'Delete')
		{
			var deleteIndex = ipamODECtrl.excelForm.selectiveDates.indexOf(date);
			if(deleteIndex != -1)
				ipamODECtrl.excelForm.selectiveDates.splice(deleteIndex,1);
		}
		else if(action === 'ClearAll')
		{
			ipamODECtrl.excelForm.selectiveDates = [];
			ipamODECtrl.excelForm.selectiveDatesModel = "";
			$('#odemultidateexceldivid').data("DateTimePicker").clear();
		}
		else if(action === 'convertToDateObject')
		{
			return moment(date, "YYYY-MM-DD-HH:mm:ss").toDate();
		}
	}


	ipamODECtrl.resetExcelDate=function(){

		// clear date models
		ipamODECtrl.excelForm.startTime = "";
		ipamODECtrl.excelForm.endTime = "";

		// destroy the datepicker and unbind the previous dp.change event listener
		try {

			if($("#odedatetimepickerexcelstart").data("DateTimePicker"))
			{
				$('#odedatetimepickerexcelstart').data("DateTimePicker").clear();
				$('#odedatetimepickerexcelend').data("DateTimePicker").clear();

				$("#odedatetimepickerexcelstart").unbind("dp.change");
				$("#odedatetimepickerexcelend").unbind("dp.change");

				$("#odedatetimepickerexcelstart").datetimepicker("destroy");
				$("#odedatetimepickerexcelend").datetimepicker("destroy");
			}

			if($("#odemultidateexceldivid").data("DateTimePicker"))
			{
				$('#odemultidateexceldivid').data("DateTimePicker").clear();

				$("#odemultidateexceldivid").unbind("dp.change");

				$("#odemultidateexceldivid").datetimepicker("destroy");
			}

		} catch(e) {
			console.error(e);
		}

		// get dateType
		var dateType = ipamODECtrl.getDateType(ipamODECtrl.excelForm.networkElement);

		//set date field pattern and error message
		ipamODECtrl.excelForm.datePattern = dateType === 'Normal' ?
				/^\d\d\d\d-([0]{0,1}[1-9]|1[012])-([1-9]|([012][0-9])|(3[01]))-(20|21|22|23|[0-1]?\d):[0-5]?\d:[0-5]?\d$/ :
				/^\d\d\d\d-([0]{0,1}[1-9]|1[012])-([1-9]|([012][0-9])|(3[01]))$/;
		ipamODECtrl.excelForm.datePatternErrorMsg = dateType === 'Normal' ? 'datetimepicker' : 'datepicker';

		// enable disable end date field
		ipamODECtrl.disableExcelEndDate = ipamODECtrl.disableEndDate(dateType, ipamODECtrl.excelForm.networkElement.aggregationOperationType);

		ipamODECtrl.excelForm.disableSelectiveDates = ipamODECtrl.disableSelectiveDatesFn(dateType);

		var minDate = (ipamODECtrl.isReadOnlyRole && ipamODECtrl.excelForm.networkElement.baseDate) ? (ipamODECtrl.excelForm.networkElement.baseDate + "-00:00:00") : undefined;

		// set date picker and bind dp.change Listeners
		$timeout(function(){

			$('#odemultidateexceldivid').datetimepicker({
				format : 'YYYY-MM-DD-00:00:00',
				minDate: minDate,
				maxDate: "now",
				useCurrent: false,
				keepOpen: true,
				widgetPositioning: {horizontal: 'right', vertical: 'bottom'}
			});

			$("#odemultidateexceldivid").on( "dp.change", function(e) {

				$timeout(function(){
					$scope.$apply(function() {
						if($("#odemultidateexcel").val() && !ipamODECtrl.excelForm.selectiveDates.includes($("#odemultidateexcel").val()))
						{
							ipamODECtrl.excelForm.selectiveDates.push($("#odemultidateexcel").val());
							ipamODECtrl.excelForm.selectiveDates.sort();
						}
					});
				},0);
			});

			if(dateType === 'Normal')
			{
				// start Time
				$('#odedatetimepickerexcelstart').datetimepicker({
					format : 'YYYY-MM-DD-HH:mm:ss',
					minDate: minDate,
					maxDate: "now",
					useCurrent: false,
					keepOpen: false,
					widgetPositioning: {horizontal: 'right', vertical: 'bottom'}
				});

				$("#odedatetimepickerexcelstart").on( "dp.change", function(e) {

					$timeout(function(){
						$scope.$apply(function() {
							ipamODECtrl.excelForm.startTime = $("#odeexcelstarttime").val();
						});
					},0);

					// $('#odedatetimepickerexcelend').data("DateTimePicker").minDate(e.date);
					$('#odedatetimepickerexcelend').data("DateTimePicker").clear();
				});

				// end Time
				$('#odedatetimepickerexcelend').datetimepicker({
					format : 'YYYY-MM-DD-HH:mm:ss',
					maxDate: "now",
					useCurrent: false,
					keepOpen: false,
					widgetPositioning: { horizontal: 'right', vertical: 'bottom'}
				});

				$("#odedatetimepickerexcelend").on( "dp.change", function(e) {

					$timeout(function(){
						$scope.$apply(function() {
							ipamODECtrl.excelForm.endTime = $("#odeexcelendtime").val();
						});
					},0);
				});
			}
			else if(['Delta Execution','Dual Time','Busy Hour','Supporting Kpi','Calculate Aging'].includes(dateType))
			{
				// start Time
				$('#odedatetimepickerexcelstart').datetimepicker({
					format : 'YYYY-MM-DD',
					minDate: minDate,
					maxDate: 'now',
					useCurrent: false,
					keepOpen: false,
					widgetPositioning: {horizontal: 'right', vertical: 'bottom'}
				});

				$("#odedatetimepickerexcelstart").on( "dp.change", function(e) {

					$timeout(function(){
						$scope.$apply(function() {
							ipamODECtrl.excelForm.startTime = $("#odeexcelstarttime").val();
						});
					},0);

					// $('#odedatetimepickerexcelend').data("DateTimePicker").minDate(e.date);
					$('#odedatetimepickerexcelend').data("DateTimePicker").clear();
					if($("#odeexcelstarttime").val())
						$('#odedatetimepickerexcelend').data("DateTimePicker").date(moment($("#odeexcelstarttime").val()).add(1,'days'));
				});

				// end Time
				$('#odedatetimepickerexcelend').datetimepicker({
					format : 'YYYY-MM-DD',
					maxDate: moment().add(1,'days').set({'hour': 0, 'minute': 0, 'second': 0}),
					useCurrent: false,
					keepOpen: false,
					widgetPositioning: { horizontal: 'right', vertical: 'bottom'}
				});

				$("#odedatetimepickerexcelend").on( "dp.change", function(e) {

					$timeout(function(){
						$scope.$apply(function() {
							ipamODECtrl.excelForm.endTime = $("#odeexcelendtime").val();
						});
					},0);
				});
			}

		},300);
	}


	ipamODECtrl.downloadReportAsExcel=function(confirm){
		
		
		var networkElement = ipamODECtrl.excelForm.networkElement;

		if(ipamODECtrl.excelForm.timeSelectionType === "timeInterval")
		{
			var startTimeModified = ipamODECtrl.setZeroTimePart('add',networkElement,ipamODECtrl.excelForm.startTime);
			var endTimeModified = ipamODECtrl.setZeroTimePart('add',networkElement,ipamODECtrl.excelForm.endTime);

			if(moment(startTimeModified, "YYYY-MM-DD-HH:mm:ss") > moment(endTimeModified, "YYYY-MM-DD-HH:mm:ss")){
				ATOMService.showMessage('error','ERROR','End time can not be less than start time. ');
				return;
			}
		}

		if(ipamODECtrl.excelForm.timeSelectionType === "selectiveDates")
		{
			if(!ipamODECtrl.excelForm.selectiveDates || !ipamODECtrl.excelForm.selectiveDates.length)
			{
				ATOMService.showMessage('error','ERROR','Selective dates is required field. ');
				return;
			}
		}

		var baseDate = (ipamODECtrl.isReadOnlyRole && networkElement && networkElement.baseDate) ? (networkElement.baseDate + "-00:00:00") : undefined;

		if(baseDate)
		{
			baseDate = moment(baseDate, "YYYY-MM-DD-HH:mm:ss");
			var baseDays = Math.ceil(moment.duration(moment().diff(baseDate)).asDays());

			if(ipamODECtrl.excelForm.timeSelectionType === "timeInterval")
			{
				// restricted from calendar
			}
			else if(ipamODECtrl.excelForm.timeSelectionType === "pastNthDay")
			{
				if(ipamODECtrl.excelForm.networkDayDiff >= baseDays)
				{
					ATOMService.showMessage('error','ERROR','Past N<sup>th</sup> Day: Maximum allowed value is ' + (baseDays-1) + " .");
					return;
				}
			}
			else if(ipamODECtrl.excelForm.timeSelectionType === "customTimeRange")
			{
				if(ipamODECtrl.excelForm.customTimeRange.customBucketType === 'Days' && ipamODECtrl.excelForm.customTimeRange.customBucketSize >= baseDays)
				{
					ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + (baseDays - 1) + ".");
					return;
				}
				else if(ipamODECtrl.excelForm.customTimeRange.customBucketType === 'Hours')
				{
					var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
					var hours = Math.floor(moment.duration(moment().diff(startTime)).asHours());
					if(ipamODECtrl.excelForm.customTimeRange.customBucketSize > hours)
					{
						ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + hours + ".");
						return;
					}
				}
				else if(ipamODECtrl.excelForm.customTimeRange.customBucketType === 'Minutes')
				{
					var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
					var minutes = Math.floor(moment.duration(moment().diff(startTime)).asMinutes());
					if(ipamODECtrl.excelForm.customTimeRange.customBucketSize > minutes)
					{
						ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + minutes + ".");
						return;
					}
				}
				else if(ipamODECtrl.excelForm.customTimeRange.customBucketType === 'Weeks')
				{
					var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
					var weeks = Math.floor(moment.duration(moment().diff(startTime)).asWeeks());
					if(ipamODECtrl.excelForm.customTimeRange.customBucketSize > weeks)
					{
						ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + weeks + ".");
						return;
					}
				}
				else if(ipamODECtrl.excelForm.customTimeRange.customBucketType === 'Months')
				{
					var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
					var months = Math.floor(moment.duration(moment().diff(startTime)).asMonths());
					if(ipamODECtrl.excelForm.customTimeRange.customBucketSize > months)
					{
						ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + months + ".");
						return;
					}
				}
				else if(ipamODECtrl.excelForm.customTimeRange.customBucketType === 'Years')
				{
					var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
					var years = Math.floor(moment.duration(moment().diff(startTime)).asYears());
					if(ipamODECtrl.excelForm.customTimeRange.customBucketSize > years)
					{
						ATOMService.showMessage('error','ERROR','Custom Time Range: Maximum allowed Time value is ' + years + ".");
						return;
					}
				}
			}
			else if(ipamODECtrl.excelForm.timeSelectionType === "TimeBuckets")
			{

				if(ipamODECtrl.excelForm.bucketType === 'Days')
				{
					
					if(ipamODECtrl.excelForm.numberOfBucket >= baseDays)
					{
						ATOMService.showMessage('error','ERROR','Number of Buckets: Maximum allowed value is ' + (baseDays - 1) + ".");
						return;
					}
					else if(!ipamODECtrl.excelForm.numberOfBucket
						&& ipamODECtrl.excelForm.numberOfBucket !== 0
						&& ipamODECtrl.bucketTypeMapping[ipamODECtrl.excelForm.bucketType] >= baseDays)
					{
						ATOMService.showMessage('error','ERROR','Number of Buckets is mandatory and maximum allowed value is ' + (baseDays - 1) + ".");
						return;
					}
				}
				else if(ipamODECtrl.excelForm.bucketType === 'Weeks')
				{
					var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
					var weeks = Math.floor(moment.duration(moment().diff(startTime)).asWeeks());

					if(ipamODECtrl.excelForm.numberOfBucket >= weeks)
					{
						ATOMService.showMessage('error','ERROR','Number of Buckets: Maximum allowed value is ' + weeks + ".");
						return;
					}
					else if(!ipamODECtrl.excelForm.numberOfBucket
							&& ipamODECtrl.excelForm.numberOfBucket !== 0
							&& ipamODECtrl.bucketTypeMapping[ipamODECtrl.excelForm.bucketType] >= weeks)
					{
						ATOMService.showMessage('error','ERROR','Number of Buckets is mandatory and maximum allowed value is ' + weeks + ".");
						return;
					}
				}
				else if(ipamODECtrl.excelForm.bucketType === 'Months')
				{
					var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
					var months = Math.floor(moment.duration(moment().diff(startTime)).asMonths());

					if(ipamODECtrl.excelForm.numberOfBucket >= months)
					{
						ATOMService.showMessage('error','ERROR','Number of Buckets: Maximum allowed value is ' + months + ".");
						return;
					}
					else if(!ipamODECtrl.excelForm.numberOfBucket
							&& ipamODECtrl.excelForm.numberOfBucket !== 0
							&& ipamODECtrl.bucketTypeMapping[ipamODECtrl.excelForm.bucketType] >= months)
					{
						ATOMService.showMessage('error','ERROR','Number of Buckets is mandatory and maximum allowed value is ' + months + ".");
						return;
					}
				}
				else if(ipamODECtrl.excelForm.bucketType === 'Years')
				{
					var startTime = moment().subtract((baseDays-1),'days').set({'hour': 0, 'minute': 0, 'second': 0});
					var years = Math.floor(moment.duration(moment().diff(startTime)).asYears());

					if(ipamODECtrl.excelForm.numberOfBucket >= years)
					{
						ATOMService.showMessage('error','ERROR','Number of Buckets: Maximum allowed value is ' + years + ".");
						return;
					}
					else if(!ipamODECtrl.excelForm.numberOfBucket
							&& ipamODECtrl.excelForm.numberOfBucket !== 0
							&& ipamODECtrl.bucketTypeMapping[ipamODECtrl.excelForm.bucketType] >= years)
					{
						ATOMService.showMessage('error','ERROR','Number of Buckets is mandatory and maximum allowed value is ' + years + ".");
						return;
					}
				}
			}
		}

		let pattern = /^[a-zA-Z0-9_]*$/;
		if(!pattern.test(ipamODECtrl.excelForm.fileName.trim()))
		{
			ATOMService.showMessage('error','Invalid File Name','Only alphanumeric and _ characters are allowed in file name input.');
			return;
		}
		
		if(ipamODECtrl.excelForm.fileName.trim().length>50){
			ATOMService.showMessage('error','File Name too long','File Name cannot have more than 50 characters.');
			return;
		}

		if(confirm) {
			ipamODECtrl.confirmAction("ExecuteAndDownloadAsExcel", "DOWNLOAD EXECUTION RESULT", "Are you sure, you want to submit Download request?");
			return;
		} else {
			angular.element('#modalForConfirmation').modal('hide');
		}


		networkElement.executionMode = 'Manual';
		networkElement.fileName = ipamODECtrl.excelForm.fileName;
		networkElement.index = 0;

		networkElement.timeSelectionType = ipamODECtrl.excelForm.timeSelectionType;

		if(ipamODECtrl.excelForm.timeSelectionType === "timeInterval"
		|| ipamODECtrl.excelForm.timeSelectionType === 'pastNthDay'
		|| ipamODECtrl.excelForm.timeSelectionType === 'customTimeRange'
		|| ipamODECtrl.excelForm.timeSelectionType === 'selectiveDates')
		{
			if(ipamODECtrl.excelForm.timeSelectionType === "timeInterval")
			{
				networkElement.startTime = startTimeModified;
				networkElement.endTime = endTimeModified;
			}
			else
			{
				delete networkElement.startTime;
				delete networkElement.endTime;
			}

			if(ipamODECtrl.excelForm.timeSelectionType === "selectiveDates")
			{
				networkElement.selectiveDates = ipamODECtrl.excelForm.selectiveDates;
			}
			else
			{
				delete networkElement.selectiveDates;
			}

			if(ipamODECtrl.excelForm.timeSelectionType === 'pastNthDay')
			{
				networkElement.networkDayDiff = ipamODECtrl.excelForm.networkDayDiff;
			}
			else
			{
				delete networkElement.networkDayDiff;
			}

			if(ipamODECtrl.excelForm.timeSelectionType === 'customTimeRange')
			{
				networkElement.customTimeRange = {
					filterType: ipamODECtrl.excelForm.customTimeRange.filterType
				};

				if(ipamODECtrl.excelForm.customTimeRange.filterType === 'Last')
				{
					networkElement.customTimeRange.customBucketType = ipamODECtrl.excelForm.customTimeRange.customBucketType;
					networkElement.customTimeRange.customBucketSize = ipamODECtrl.excelForm.customTimeRange.customBucketSize;
				}
			}
			else
			{
				delete networkElement.customTimeRange;
			}

			if(ipamODECtrl.excelForm.bucketType) {

				networkElement.bucketType = ipamODECtrl.excelForm.bucketType;
				networkElement.bucketSize = ipamODECtrl.excelForm.bucketSize;
				networkElement.counter = ipamODECtrl.getCounterValueUsingBucket(ipamODECtrl.excelForm.bucketType, ipamODECtrl.excelForm.bucketSize);
			}
			else
			{
				networkElement.counter = 4;

				if(networkElement.aggregationOperationType === 'timeBasedAggregation')
				{
					ipamODECtrl.getBucketValueUsingCounter(networkElement.counter, networkElement);
				}
			}

			if(ipamODECtrl.excelForm.numberOfBucket)
				networkElement.numberOfBucket = ipamODECtrl.excelForm.numberOfBucket;
			else
				delete networkElement.numberOfBucket;
		}
		else
		{
			networkElement.bucketType = ipamODECtrl.excelForm.bucketType;
			networkElement.bucketSize = ipamODECtrl.excelForm.bucketSize;
			networkElement.counter = ipamODECtrl.getCounterValueUsingBucket(ipamODECtrl.excelForm.bucketType, ipamODECtrl.excelForm.bucketSize);
			networkElement.numberOfBucket = ipamODECtrl.excelForm.numberOfBucket;

			delete networkElement.timeSelectionType;
			delete networkElement.startTime;
			delete networkElement.endTime;
			delete networkElement.networkDayDiff;
			delete networkElement.customTimeRange;
			delete networkElement.selectiveDates;
		}

		if(ipamODECtrl.excelForm.hourList && ipamODECtrl.excelForm.hourList.length) {
			networkElement.hourList = ipamODECtrl.excelForm.hourList;
		}
		else {
			delete networkElement.hourList;
		}

		networkElement.doubleTimeAggFlag = networkElement.headerList.some(el => el.isNestedDual);

		let fileFormat = ipamODECtrl.excelForm.fileFormat ? ipamODECtrl.excelForm.fileFormat : 'excel';
		delete networkElement.fileFormat;

		ipamODECtrl.excelForm.fileName = ipamODECtrl.excelForm.fileName.trim();

		var postData = {
			username: $rootScope.globals.currentUser.username,
			project: $rootScope.project,
			fileName: ipamODECtrl.excelForm.fileName,
			fileFormat: fileFormat,
			networkElementList: [networkElement],
			dashboardDoubleAggregationPresent: ipamODECtrl.getDashboardDoubleAggregationPresentFlag([networkElement]),
			agingFlag: ipamODECtrl.getAgingFlag([networkElement]),
			supportingDashboardFlag: ipamODECtrl.getSupportingDashboardFlag([networkElement])
		}
		if(ipamODECtrl.getConsecutiveFlag(postData.networkElementList))
			postData.consecutiveFlag = true;

		var queryStringNodeName = networkElement.executionType === 'SingleProduct' ? networkElement.nodeName : 'multiProduct';
		var queryString = "operation=downloadODEExcel" + "&nodeName=" + queryStringNodeName;

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"project": $rootScope.project,
			"fileName": ipamODECtrl.excelForm.fileName
		};

		angular.element('#modalForExecuteAndDownloadExcel').modal('hide');
		ATOMService.showMessage('success',"Report Download request submitted sucessfully.");

		var fileName = ipamODECtrl.excelForm.fileName;

		function callbackfunction(data) {

			if(postData.dashboardDoubleAggregationPresent)
			{
				ATOMService.showMessage('success',"Request submitted successfully. Report execution progress will be updated via notification.");
			}
			else
			{
				let utf8decoder = null;
				let hdfsFlag = false;
				let requestIsInProgressTxt = "";

				try {utf8decoder = new TextDecoder();}catch (e) {
					console.error('Unable to obtain utf8decoder for arrayBuffer parsing.');
				}
				try {
					let jsonRes = JSON.parse(utf8decoder.decode(data));
					hdfsFlag  = !!jsonRes.statusCode.AppData.appdata.hdfsFlag;
					requestIsInProgressTxt = jsonRes.statusCode.AppData.appdata.requestType;
				}catch (e) {
					console.error('Unable to parse arrayBuffer.');
				}

				if(requestIsInProgressTxt === 'REQUEST_IS_IN_PROGRESS')
				{
					ATOMService.showMessage('success',"Request is already in process ...");
				}
				else if(hdfsFlag)
				{
					ATOMService.showMessage('success',"Request submitted successfully. Report execution progress will be updated via notification.");
				}
				else
				{
					let type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8";
					if(postData.fileFormat === 'csv')
					{
						type= "application/zip";
					}
					var blob = new Blob([data], {
						type:type
					});
					var dataTemp=saveAs(blob,fileName);
				}
			}
		}

		ATOMCommonServices.dowloadExcelForODE(postData,Constants.IPM_USER_TABULAR_DASHBOARD_CONTEXT,header,queryString,callbackfunction);
	}


	ipamODECtrl.saveNEToDashboard=function(action, data){

		if(action === 'OpenModal')
		{
			if($rootScope.streamingFlag) {
				ATOMService.showMessage('error','WARNING','You have to stop live stream in order to perform the action. ');
				return;
			}

			if(!$rootScope.structuredRestriction['atom32.10']['Write']){
				ATOMService.showMessage('error','WARNING', 'Permission Denied. Please contact admin. ');
				return;
			}

			if($scope.odesavenetodashboardform) {
				$scope.odesavenetodashboardform.$setUntouched();
				$scope.odesavenetodashboardform.$setPristine();
			}

			var elementIndexInArr = ipamODECtrl.networkElementList.findIndex(el => el === data);
			var networkElement = angular.copy(ipamODECtrl.networkElementList[elementIndexInArr]);

			networkElement.newDashboardName = networkElement.dashboardName;

			if(networkElement.dashboardName && !networkElement.accessData)
			{
				networkElement.dashboardName = "";
				networkElement.newDashboardName = "";
			}

			ipamODECtrl.saveTodashboardObj = networkElement;
			ipamODECtrl.saveTodashboardNEIndex = elementIndexInArr;

			angular.element('#modalForSaveNEToDashboard').modal('show');
		}
		else if(action === 'Save')
		{
			ipamODECtrl.saveODENEToDashboard();
		}
	}


	ipamODECtrl.saveODENEToDashboard=function(){

		var queryString = "operation=createTabularDataProvisioning";

		var networkElement = angular.copy(ipamODECtrl.saveTodashboardObj);

		var oldDashboardName = networkElement.dashboardName;
		var newDashboardName = networkElement.newDashboardName;
		networkElement.dashboardName = networkElement.newDashboardName;
		delete networkElement.newDashboardName;

		var version = undefined;

		// Whether Same Dashboard is getting updated then send same assign data
		// Else create AccessData with current user and atom user

		if(oldDashboardName && newDashboardName && oldDashboardName === newDashboardName)
		{
			version = networkElement.version;
			queryString = "operation=modifyTabularDataProvisioning";

			if(!networkElement.accessData.length || !networkElement.assigneduser.length)
			{
				console.error('AccessData is Empty. Please contact admin. DashboardNames::' + oldDashboardName + ":::" + newDashboardName);
				ATOMService.showMessage('error','WARNING','Unable to save On Demand Execution Dashboard. Please contact admin. ');
				return;
			}

			var permission = networkElement.accessData.find(el=>el.userName === $rootScope.groupName);
			if(networkElement.createdBy != $rootScope.globals.currentUser.username && (!permission || !permission.write))
			{
				console.error('permission is empty or write permission is false.');
				ATOMService.showMessage('error','Dashboard Creation Failed.',"User doesn't have permission to update this Dashboard. <br/><br/> Please save Dashboard with other Name.");
				return;
			}
		}
		else
		{
			networkElement.assigneduser = [];
			networkElement.accessData = [];

			if($rootScope.groupName)
			{
				networkElement.assigneduser.push($rootScope.groupName);
				networkElement.accessData.push({ userName : $rootScope.groupName, write: true, execute: true, delete: true, assign: true, readOnly: ($rootScope.globals.currentUser.username === 'atom') ? true : false});
			}
		}

		// Add atom user if not present
		if(!networkElement.assigneduser.includes('atomGroup'))
		{
			networkElement.assigneduser.push('atomGroup');
			networkElement.accessData.push({ userName : 'atomGroup', write: true, execute: true, delete: true,assign: true, readOnly: true});
		}

		if(!networkElement.createdBy)
		{
			networkElement.createdBy = $rootScope.globals.currentUser.username;
		}

		if(!networkElement.userTag)
		{
			networkElement.userTag = $rootScope.globals.currentUser.username;
		}

		// prepare aggregation data for submission
		if(networkElement.aggregationList && networkElement.aggregationList.row && networkElement.aggregationList.row.length)
		{
			networkElement.aggregationList.row.forEach(aggr=> ipamODECtrl.prepareAndSyncSpecificList(aggr, true));
		}

		// remove bucket info while saving dashboard
//		delete networkElement.bucketType;
//		delete networkElement.bucketSize;
//		delete networkElement.hourList;
		// delete networkElement.numberOfBucket;
		delete networkElement.counter;
		delete networkElement.startTime;
		delete networkElement.endTime;
		delete networkElement.selectiveDates

		if(networkElement.timeSelectionType === 'timeInterval' || networkElement.timeSelectionType === 'selectiveDates')
		{
			delete networkElement.timeSelectionType;
		}

		if(networkElement.aggregationOperationType != 'timeBasedAggregation' || !networkElement.numberOfBucket)
		{
			delete networkElement.numberOfBucket;
		}

		let fileFormat = networkElement.fileFormat ? networkElement.fileFormat : 'excel';
		delete networkElement.fileFormat;

		var postData = {
			username: $rootScope.globals.currentUser.username,
			project: $rootScope.project,
			fileFormat: fileFormat,
			version: version,
			networkElementList: [networkElement],
			dashboardDoubleAggregationPresent: ipamODECtrl.getDashboardDoubleAggregationPresentFlag([networkElement]),
			agingFlag: ipamODECtrl.getAgingFlag([networkElement]),
		}
		if(ipamODECtrl.getConsecutiveFlag(postData.networkElementList))
			postData.consecutiveFlag = true;

		var header = {
			"username": $rootScope.globals.currentUser.username,
			"createdBy" : $rootScope.globals.currentUser.username,
			"project": $rootScope.project
		};

		ATOMCommonServices.commonPostMethod(postData,Constants.IPM_USER_TABULAR_DASHBOARD_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS"){

					try{
						// update dashboardname and access data in networkElementList Row
						var ne = ipamODECtrl.networkElementList[ipamODECtrl.saveTodashboardNEIndex];
						ne.dashboardName = networkElement.dashboardName;
						ne.assigneduser = networkElement.assigneduser;
						ne.accessData = networkElement.accessData;
						ne.createdBy = networkElement.createdBy;
						ne.userTag = networkElement.userTag;
						ne.fileFormat = postData.fileFormat;
					} catch (e)
					{
						console.error(e);
					}
					angular.element('#modalForSaveNEToDashboard').modal('hide');
					ATOMService.showMessage('success',"Dashboard saved sucessfully.");
				}
				else
				{
					if(queryString === "operation=createTabularDataProvisioning" && response.AppData.errorCode === '9003')
					{
						ATOMService.showMessage('error','Dashboard Creation Failed.',"Dashboard already Exists with same Name.");
					}
					else
					{
						ATOMService.showMessage('error','WARNING','Unable to save Dashboard. Please contact admin. ');
					}
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});

	}


	ipamODECtrl.fileDownloadforResult=function(action, finalObj){

		if(action === 'OpenModal')
		{
			if($scope.odesaveresult) {
				$scope.odesaveresult.$setUntouched();
				$scope.odesaveresult.$setPristine();
			}

			var execObj = finalObj.execObj;

			var networkElement = finalObj.networkElement;

			ipamODECtrl.saveExcelObj = {
				fileName : networkElement.dashboardName,
				fileFormat: networkElement.fileFormat ? networkElement.fileFormat : 'excel',
				execObj: execObj
			};

			angular.element('#modalForFileDownloadforResult').modal('show');
		}
		else if(action === 'Save')
		{
			let pattern = /^[a-zA-Z0-9_]*$/;
			if(!pattern.test(ipamODECtrl.saveExcelObj.fileName.trim()))
			{
				ATOMService.showMessage('error','Invalid File Name','Only alphanumeric and _ characters are allowed in file name input.');
				return;
			}
			
			if(ipamODECtrl.saveExcelObj.fileName.trim().length>50){
				ATOMService.showMessage('error','File Name too long','File name cannot have more than 50 characters.');
				return;
			}

			angular.element('#modalForFileDownloadforResult').modal('hide');
			ATOMService.showMessage('success',"Report Download request submitted sucessfully.");
			ipamODECtrl.saveExcelObj.fileName = ipamODECtrl.saveExcelObj.fileName.trim();
			ipamODECtrl.downloadExcel(ipamODECtrl.saveExcelObj);
		}
	}


	ipamODECtrl.downloadExcel=function(excelObj){

		let fileFormat = excelObj.fileFormat;
		delete excelObj.fileFormat;

		var postData={fileName: excelObj.fileName, fileFormat: fileFormat, appdata: {overAllResult:[excelObj.execObj] }};
		var queryString="action=getFile";

		var header={};
		header.action="getFile";
		header['X-Publisher-Name']="IPM";
		header.project = $rootScope.project;

		function callbackfunction(data,status,header,config,queryString,saveAs) {

			let utf8decoder = null;
			let hdfsFlag = false;
			try {utf8decoder = new TextDecoder();}catch (e) {
				console.error('Unable to obtain utf8decoder for arrayBuffer parsing.');
			}
			try {
				let jsonRes = JSON.parse(utf8decoder.decode(data));
				hdfsFlag  = !!jsonRes.statusCode.AppData.appdata.hdfsFlag;
			}catch (e) {
				console.error('Unable to parse arrayBuffer.');
			}

			if(hdfsFlag)
			{
				ATOMService.showMessage('success',"Request submitted successfully. Report execution progress will be updated via notification.");
			}
			else
			{
				let type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8";
				if(postData.fileFormat === 'csv')
				{
					type= "application/zip";
				}

				var blob = new Blob([data], {
					type:type
				});

				var dataTemp=saveAs(blob,excelObj.fileName);
			}
		}

		ATOMCommonServices.postExcelDataForDashboard(postData,'/IPAM/UserTabularDashBoard',header,callbackfunction);
	}


	ipamODECtrl.updateSpecificList=function(data, oldList){

		oldList = oldList ? oldList.split('|') : [];

		if(data.specificList && data.specificList.length > oldList.length) {

			// single add
			var changes = data.specificList.filter(n=> !oldList.includes(n));

			if(!data.manualSpecificList.find(el=> el === changes[0]))
			{
				data.manualSpecificList.push(changes[0]);
			}

		} else if (data.specificList && data.specificList.length < oldList.length) {

			// single removal
			var changes = oldList.filter(n=> !data.specificList.includes(n));

			var removeIndex = data.manualSpecificList.findIndex(el => el === changes[0]);

			if(removeIndex >= 0)
			{
				data.manualSpecificList.splice(removeIndex,1);
			}
		}
		else if(!data.specificList && oldList.length) {

			// removal of last element from specific list makes specific list as undefined
			var removeIndex = data.manualSpecificList.findIndex(el => el === oldList[0]);

			if(removeIndex >= 0)
			{
				data.manualSpecificList.splice(removeIndex,1);
			}
		}
	}


	ipamODECtrl.prepareAndSyncSpecificList=function(aggr, deleteValueListFlag)
	{
		if(deleteValueListFlag && aggr.specificValueList)
		{
			delete aggr.specificValueList;
		}

		if(!aggr.specific)
		{
			aggr.specificList = [];
			aggr.manualSpecificList = [];
			return aggr;
		}

		if(!aggr.specificList)
			aggr.specificList = [];

		if(!aggr.manualSpecificList)
			aggr.manualSpecificList = [];

		// unique combined list
		var combinedList = Array.from(new Set(aggr.specificList.concat(aggr.manualSpecificList)));

		aggr.specificList = angular.copy(combinedList);
		aggr.manualSpecificList = angular.copy(combinedList);

		return aggr;
	}


	ipamODECtrl.manualSpecificListFtn=function(action, data){

		if(action === 'openModal')
		{
			ipamODECtrl.manualSpecificSearchTxt = "";
			ipamODECtrl.manualSpecificPageNo =1;

			ipamODECtrl.ms = {
				manualInputStr: "",
				manualEntryArr: [],
				aggr: data
			}

			if(data.manualSpecificList)
			{
				ipamODECtrl.ms.manualEntryArr = data.manualSpecificList;
			}
			else if(data.specificList)
			{
				ipamODECtrl.ms.manualEntryArr = angular.copy(data.specificList);
			}

			if($scope.manualSpecificPanelForm)
			{
				$scope.manualSpecificPanelForm.$setUntouched();
				$scope.manualSpecificPanelForm.$setPristine();
			}

			angular.element('#manualSpecificModel').modal('show');
		}
		else if(action === 'add')
		{
			var values = ipamODECtrl.ms.manualInputStr.split('|').filter(el=> !!el);

			for(value of values) {

				if(ipamODECtrl.ms.manualEntryArr.find(el=> el === value))
					continue;

				ipamODECtrl.ms.manualEntryArr.push(value);

				//add value to specific list if not exist
				if(ipamODECtrl.ms.aggr.specificList)
				{
					if(!ipamODECtrl.ms.aggr.specificList.find(el => el === value))
						ipamODECtrl.ms.aggr.specificList.push(value);
				}
			}

			ipamODECtrl.ms.manualInputStr = "";
			$scope.manualSpecificPanelForm.$setUntouched();
			$scope.manualSpecificPanelForm.$setPristine();
		}
		else if(action === "delete")
		{
			var deleteIndex = ipamODECtrl.ms.manualEntryArr.findIndex(el=> el === data);
			ipamODECtrl.ms.manualEntryArr.splice(deleteIndex,1);

			//delete from specific list if exists
			if(ipamODECtrl.ms.aggr.specificList)
			{
				var specificIndex = ipamODECtrl.ms.aggr.specificList.findIndex(el => el === data);
				if(specificIndex >= 0)
					ipamODECtrl.ms.aggr.specificList.splice(specificIndex,1);
			}
		}
	}


	ipamODECtrl.getCounterValueUsingBucket=function(bucketType, bucketSize){

		var counterValueObj = {
			"5Minutes": 0,
			"Minutes": 1,
			"Hours": 2,
			"Days": 4,
			"Weeks": 5,
			"Months": 6,
			"Years": 8
		}

		if(bucketType === 'Minutes')
		{
			if(bucketSize <= 5)
			{
				bucketType = '5Minutes'
			}
		}

		return counterValueObj[bucketType];
	}


	ipamODECtrl.getBucketValueUsingCounter=function(counter, object){

		if(!counter && counter !== 0 )
			return;

		var bucketValueObj = {
			0:"Minutes",
			1:"Minutes",
			2:"Hours",
			4:"Days",
			5:"Weeks",
			6:"Months",
			8:"Years"
		}

		object.bucketType = bucketValueObj[counter];

		if(counter === 0)
		{
			object.bucketSize = 5;
		}
		else if(counter === 1)
		{
			object.bucketSize = 15;
		}
		else
		{
			object.bucketSize = 1;
		}
	}


	ipamODECtrl.showBreachDetailsForODE=function(finalObj){

		if(!finalObj.execObj.tabularResult.breachDetail.hasBreaches)
		{
			ATOMService.showMessage('warning','No Anomalies Found..');
			return;
		}

		ipamODECtrl.breachDetailObj = angular.copy(finalObj.execObj.tabularResult.breachDetail);

		ipamODECtrl.breachDetailObj.searchTxt = "";
		ipamODECtrl.breachDetailObj.reportForText = finalObj.execObj.reportForText;
		ipamODECtrl.breachDetailObj.intervalText = finalObj.execObj.intervalText;

		if(ipamODECtrl.breachDetailObj.chart)
		{
			if(ipamODECtrl.breachDetailObj.chart.data && ipamODECtrl.breachDetailObj.chart.data.length > 0) {
				ipamODECtrl.breachDetailObj.chart.dataAvailableForChart = true;
			} else {
				ipamODECtrl.breachDetailObj.chart.dataAvailableForChart = false;
			}
		}

		if(ipamODECtrl.breachDetailObj.chart.dataAvailableForChart)
		{
			//draw chart
			$timeout(function(){

				var divId = document.getElementById("breachDetailChartDivId");
				hddOptions = drawBreachDetailChart(divId,ipamODECtrl.breachDetailObj.chart.data);
				hddChart = new Highcharts.Chart(hddOptions);
			}, 1000);
		}

		$timeout(function(){
			angular.element('#modalForBreachDetail').modal('show');
		},100);
	}



	ipamODECtrl.downloadBreachDetailsForODE=function(){


		try{
			var fileName = "Anomaly_Details";
			fileName += "_" + moment().format("DD-MM-YYYY-HH-mm-ss");
			fileName.replace(/[/\\?%*:|"<>]/g, '-');
			fileName += ".xlsx";

			// create excel and workbook
			var wb = XLSX.utils.book_new();
			wb.Props = {
				Title: "Anomaly_Details",
				Author: $rootScope.projectNameHeader + "_" + $rootScope.globals.currentUser.username,
				CreatedDate: new Date()
			};
			wb.SheetNames.push('Anomaly_Details');

			// fill data in workbook
			var header_row = ipamODECtrl.breachDetailObj.table.tableHeaderList;
			var fieldList = ipamODECtrl.breachDetailObj.table.tableHeaderList;
			var ws_data = []; // a row column matrix
			ws_data.push(header_row);
			ipamODECtrl.breachDetailObj.table.data.forEach(el=> {
				var data_row = [];
				fieldList.forEach(field => {
					data_row.push((el[field] || el[field] === 0) ? el[field] : '');
				});
				ws_data.push(data_row);
			});
			var ws = XLSX.utils.aoa_to_sheet(ws_data);
			wb.Sheets['Anomaly_Details'] = ws;

			// download excel sheet
			var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
			function s2ab(s) {
				var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
				var view = new Uint8Array(buf);  //create uint8array as viewer
				for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
				return buf;
			}
			saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), fileName);
		}
		catch(error){
			console.error(error);
			ATOMService.showMessage('error','ERROR','Unable to download anomaly details.');
		}
	}


	function drawBreachDetailChart(divId, data){

		return {

			chart: {
				type: 'sunburst',
				renderTo: divId,
				backgroundColor: '#FFFFFF',
				height: 400,
				events: {
		            render: function() {
		                this.series[0].points.forEach(function(point) {
		                    point.dataLabel.css({
		                        textOverflow: 'none'
		                    });
		                });
		            }
				}
		    },

		    // Let the center circle be transparent
		    colors: ['transparent', '#2caffe', '#544fc5', '#00e272', '#fe6a35', '#6b8abc', '#d568fb', '#2ee0ca', '#fa4b42', '#feb56a', '#91e8e1'],
		    title: {
		        text: ''
		    },
		    series: [{
		        type: 'sunburst',
		        data: data,
		        name: 'Root',
		        allowDrillToNode: true,
		        borderRadius: 3,
		        cursor: 'pointer',
		        dataLabels: {
		            format: '<b>{point.name}</b> : <b>{point.value}</b>',
		            rotationMode: 'circular',
		            filter: {
		                property: 'innerArcLength',
		                operator: '>',
		                value: 16
		            }
		        },
		        levels: [{
		            level: 1,
		            levelIsConstant: false,
		            dataLabels: {
		                filter: {
		                    property: 'outerArcLength',
		                    operator: '>',
		                    value: 64
		                }
		            }
		        }, {
		            level: 2,
		            colorByPoint: true,
		        },
		        {
		            level: 3,
		            colorVariation: {
		                key: 'brightness',
		                to: -0.5
		            }
		        }]

		    }],
		    tooltip: {
		        headerFormat: '',
		        pointFormat: '<b>{point.name}</b> : <b>{point.value}</b>'
		    },
		    credits: {
				enabled: false
			},
			exporting: {
				enabled: false
			}
		}

	}


	ipamODECtrl.fetchCellDetails=function(finalObj,data,column){

		try{
			if(finalObj.networkElement.aggregationOperationType === 'timeBasedAggregation'
				&& ipamODECtrl.clickableCellsArr.includes(((data['fieldValue_'+column].split('#_#')[1] || '').split('##-##')[0]+'')) )
			{
				// do nothing
			}
			else
			{
				return;
			}
		}
		catch (error) {
			return;
		}
		
		// On clicking a breached cell
		var postData = {
			"networkElement": finalObj.networkElement,
			"headerArray": finalObj.execObj.tabularResult.tableHeaderList,
			"dataObject": data,
			"columnName": "",
			"cellIndex": column-1,
		}

		postData.columnName = finalObj.execObj.tabularResult.tableHeaderList[column-1].split('#_#')[0];

		ipamODECtrl.clickInputObj = postData;

		ipamODECtrl.clickOutput = {
				title: '',
				searchTxt: '',
				freezeIndex: -1,
				execObj: null
		};

		var queryString = "operation=clearcodeOutputForBreachedKpi";

		var header = {};

		ATOMCommonServices.commonPostMethod(postData,Constants.IPM_USER_TABULAR_DASHBOARD_CONTEXT,header,queryString).then(
			function successCallback(response){

				if( response.AppData.type == "SUCCESS") {

					if(ipamODECtrl.clickInputObj && ipamODECtrl.clickInputObj === postData)
					{
						if(!response.AppData.appdata.overAllResult || !response.AppData.appdata.overAllResult[0])
						{
							ATOMService.showMessage('error','WARNING','Unable to fetch kpi details. Please contact admin. ');
							return;
						}

						var execObj = response.AppData.appdata.overAllResult[0];

						var lastIndex = execObj.nfName.lastIndexOf(" Between ");

						execObj.reportForText = execObj.nfName.substring(0, lastIndex);
						execObj.intervalText = execObj.nfName.substring(lastIndex).replace(" Between ","");

						ipamODECtrl.clickOutput.freezeIndex = execObj.freezeIndex;
						ipamODECtrl.clickOutput.execObj = execObj;

						$timeout(function(){
							angular.element('#modalForCellDetails').modal('show');
						},400);
					}

				}
				else {
					ATOMService.showMessage('error','WARNING','Unable to fetch kpi details. Please contact admin. ');
				}
			},
			function errorCallback(responseData){
				ATOMService.showMessage('error','ERROR','server is not reachable');
		});
	}


	ipamODECtrl.closeCellDetailsModal=function(){

		angular.element('#modalForCellDetails').modal('hide');

		$timeout(function(){
			ipamODECtrl.clickInputObj = null;

			ipamODECtrl.clickOutput = {
					title: '',
					searchTxt: '',
					freezeIndex: -1,
					execObj: null
			};
		},400);
	}


	ipamODECtrl.openModalForQueryDescription=function(parentModalId=null){

		var mergedTerms = Array.from(new Set(ipamODECtrl.dynamicQueryTypeList.concat(ipamODECtrl.dynamicQueryTypeList, ipamODECtrl.dynamicQueryClauseList)));

		ipamODECtrl.queryDescParentModalId = parentModalId;
		ipamODECtrl.queryDescList = Constants.queryDescriptions.filter(el=> mergedTerms.includes(el.term));

		if(ipamODECtrl.queryDescParentModalId)
		{
			angular.element('#'+ipamODECtrl.queryDescParentModalId).modal('hide');
		}

		$timeout(function(){
			angular.element('#modalForQueryDescription').modal('show');
		},400);
	}


	ipamODECtrl.closeModalForQueryDescription=function(){

		angular.element('#modalForQueryDescription').modal('hide');
		if(ipamODECtrl.queryDescParentModalId)
		{
			$timeout(function(){
				angular.element('#'+ipamODECtrl.queryDescParentModalId).modal('show');
			},400);
		}
	}
	
	//////////////////////////////////FORECASTING///////////////
	ipamODECtrl.redirectToForecastingPage=function(value,output,index){
		var neData={};
		neData.networkElement=output.networkElement;
		neData.tabularResult=output.execObj;
		
		if(value){
			neData.kpiName=value;
		}
		
		$window.localStorage.setItem('odeNetworkElement', JSON.stringify(angular.copy(neData)));
		$window.open('#/aimlForecasting', '_blank');
		
	}


	$scope.$on('$destroy', function(event) {
		document.removeEventListener('fullscreenchange', ipamODECtrl.showHideNECreation)
	});

};
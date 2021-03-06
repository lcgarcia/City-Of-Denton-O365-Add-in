/**
 * Jobcost Controller
 */

app.controller('jobcost2Ctrl', [
  '$http',
  '$scope',
  '$rootScope',
  '$state',
  'jobcostService',
  'jobcostService2',
  'trendService',
  'modalService',
  function($http, $scope, $rootScope, $state, jobcostService, jobcostService2, trendService, modalService) {
    
    $scope.filteredDepartment = [];
    $scope.filteredCompany = [];
    $scope.filteredProject = [];
    $scope.filteredJob = [];
    $scope.filteredDetails = [];
    $scope.monthValues = [{
      nameShort: "oct",
      name: "October"
    }, {
      nameShort: "nov",
      name: "November"
    }, {
      nameShort: "dec",
      name: "December"
    }, {
      nameShort: "jan",
      name: "January"
    }, {
      nameShort: "feb",
      name: "February"
    }, {
      nameShort: "mar",
      name: "March"
    }, {
      nameShort: "apr",
      name: "April"
    }, {
      nameShort: "may",
      name: "May"
    }, {
      nameShort: "jun",
      name: "June"
    }, {
      nameShort: "jul",
      name: "July"
    }, {
      nameShort: "aug",
      name: "August"
    }, {
      nameShort: "sep",
      name: "September"
    }, {
      nameShort: "13th",
      name: "13th"
    }];
    
    $scope.jobStatus = [{
        key: "Open",
        name: "Open",
        jobList: []
      },
      {
        key: "Closed",
        name: "Closed",
        jobList: []
      }
    ];
    
    $scope.filteredDetails = [];
    $scope.filteredCatCode1 = [];
    $scope.filteredCC1Descriptions = [];
    $scope.filteredCatCode2 = [];
    $scope.filteredCC2Descriptions = [];
    $scope.filteredCatCode1Description = [];
    $scope.filteredCatCode2Description = [];
    
    $scope.allOptionValue = {
      key: "*All",
      name: "*All"
    };
    $scope.selectedValues.optional = {};
    
    $scope.reportDetails = {};
    $scope.dataErrorMsg = "No Data Returned";
    
    $rootScope.$on('$viewContentLoaded', jobcost2ReportDates);
    $(document).ready(function() {
      //Enables popup help boxes over labels
      $('[data-toggle="popover"]').popover();
    });
    
    function buildPage() {
      //Set dates
      $scope.selectedValues.dates = {};
      $scope.selectedValues.dates.monthStart = "";
      $scope.selectedValues.dates.monthEnd = "";
      $scope.selectedValues.dates.yearStart = "";
      $scope.selectedValues.dates.yearEnd = "";
      $scope.selectedValues.dates.jdeYear = "";
      $scope.selectedValues.dates.jdeFiscalYear = "";
      
      $scope.selectedValues.dates.monthStart2 = "";
      $scope.selectedValues.dates.monthEnd2 = "";
      $scope.selectedValues.dates.yearStart2 = "";
      $scope.selectedValues.dates.yearEnd2 = "";
      
      $scope.reportDetails.show = false;
      $scope.reportDetails.msg = "";
      
      //Set Month IDs
      var i;
      for (i = 0; i < $scope.monthValues.length; i++) {
        $scope.monthValues[i].key = i;
      }
      $scope.selectedValues.dates.monthStart = $scope.monthValues[11];
      $scope.selectedValues.dates.monthEnd = $scope.monthValues[11];
      $scope.selectedValues.dates.monthStart2 = $scope.monthValues[11];
      $scope.selectedValues.dates.monthEnd2 = $scope.monthValues[11];
      
      setDetailData();
      setReportData();
    }
    
    function setDetailData() {
      $scope.filteredDetails = [{
          name: "No Details"
        },
        {
          name: "Cost Code/Type Details"
        },
        {
          name: "FERC/Cost Code Subtotals"
        },
        {
          name: "Cost Type Subtotals"
        },
        {
          name: "Trend - Expenditures"
        },
        {
          name: "Trend - Budget"
        },
        {
          name: "Trend - Encumbrances"
        }
      ];
      
      //Set Detail IDs
      var i;
      for (i = 0; i < $scope.filteredDetails.length; i++) {
        $scope.filteredDetails[i].key = i;
      }
      $scope.selectedValues.details = $scope.filteredDetails[1];
    }
    
    /**
     * [setReportData calls API to get report data]
     */
    function setReportData() {
      var rType = $scope.selectedValues.report.type;
      
      modalService.showDataLoadingModal();
      jobcostService.getReportData(rType).then(function(data) {
        $scope.$apply(function() {
          $scope.filteredDepartment = (data.departments) ? data.departments : [];
          $scope.filteredCompany = (data.company) ? data.company : [];
          $scope.filteredProject = (data.projects) ? data.projects : [];
          $scope.filteredJob = (data.jobs) ? data.jobs : [];
          $scope.filteredCatCode1 = (data.catCodeHead) ? data.catCodeHead : [];
          $scope.filteredCC1Descriptions = [];
          $scope.filteredCC2Descriptions = [];
          
          $scope.filteredDepartment.unshift($scope.allOptionValue);
          $scope.filteredCompany.unshift($scope.allOptionValue);
          $scope.filteredProject.unshift($scope.allOptionValue);
          $scope.filteredJob.unshift($scope.allOptionValue);
          //$scope.filteredDetails.unshift($scope.allOptionValue);
          $scope.jobStatus.unshift($scope.allOptionValue);
          $scope.filteredCatCode1.unshift($scope.allOptionValue);
          $scope.filteredCC1Descriptions.unshift($scope.allOptionValue);
          $scope.filteredCC2Descriptions.unshift($scope.allOptionValue);
          
          $scope.selectedValues.department = $scope.allOptionValue;
          $scope.selectedValues.company = $scope.allOptionValue;
          $scope.selectedValues.project = $scope.allOptionValue;
          $scope.selectedValues.job = $scope.allOptionValue;
          $scope.selectedValues.jobStatus = $scope.allOptionValue;
          //$scope.selectedValues.details = $scope.allOptionValue;
          
          $scope.filteredCatCode2 = $scope.filteredCatCode1;
          $scope.selectedValues.optional.cat1 = $scope.allOptionValue;
          $scope.selectedValues.optional.cat2 = $scope.allOptionValue;
          $scope.selectedValues.optional.cat1Description = $scope.allOptionValue;
          $scope.selectedValues.optional.cat2Description = $scope.allOptionValue;
          
          modalService.hideDataLoadingModal();
        });
      });
    }
    
    $scope.selectedDepartment = function() {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      
      if (dKey == "*All") {
        setReportData();
      }
      else {
        modalService.showDataLoadingModal();
        jobcostService.getCompanies(rType, dKey).then(function(data) {
          $scope.$apply(function() {
            $scope.filteredCompany = data;
            
            $scope.filteredCompany.unshift($scope.allOptionValue);
            $scope.selectedValues.company = $scope.allOptionValue;
            
            jobcostService.getProjects(rType, dKey, cKey).then(function(projects) {
              $scope.$apply(function() {
                //$scope.debugMsg = JSON.stringify(projects);
                $scope.filteredProject = projects;
                
                $scope.filteredProject.unshift($scope.allOptionValue);
                $scope.selectedValues.project = $scope.allOptionValue;
                
                jobcostService.getJobs(rType, dKey, cKey, pKey).then(function(jobs) {
                  $scope.$apply(function() {
                    $scope.filteredJob = jobs;
                    
                    $scope.filteredJob.unshift($scope.allOptionValue);
                    $scope.selectedValues.job = $scope.allOptionValue;
                    
                    modalService.hideDataLoadingModal();
                  });
                });
              });
            });
          });
        });
      }
    }
    
    $scope.selectedCompany = function() {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      
      modalService.showDataLoadingModal();
      jobcostService.getProjects(rType, dKey, cKey).then(function(data) {
        $scope.$apply(function() {
          $scope.filteredProject = data;
          
          $scope.filteredProject.unshift($scope.allOptionValue);
          $scope.selectedValues.project = $scope.allOptionValue;
          
          jobcostService.getJobs(rType, dKey, cKey, pKey).then(function(jobs) {
            $scope.$apply(function() {
              $scope.filteredJob = jobs;
              
              $scope.filteredJob.unshift($scope.allOptionValue);
              $scope.selectedValues.job = $scope.allOptionValue;
              
              modalService.hideDataLoadingModal();
            });
          });
        });
      });
    }
    
    var updateJobs = function() {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      var jsKey = $scope.selectedValues.jobStatus.key;
      
      modalService.showDataLoadingModal();
      jobcostService.getJobWithStatus(rType, dKey, cKey, pKey, jsKey).then(function(data) {
        $scope.$apply(function() {
          $scope.filteredJob = [];
          if (data[0]) {
            $scope.filteredJob = data;
          }
          $scope.filteredJob.unshift($scope.allOptionValue);
          $scope.selectedValues.job = $scope.allOptionValue;
          
          modalService.hideDataLoadingModal();
        });
      });
    }
    
    var updatedMonths = function(monthStart, monthEnd) {
      if (monthStart < 3) monthStart += 10;
      else {
        if (monthStart == 12) monthStart++;
        else monthStart -= 2;
      }
      
      if (monthEnd < 3) monthEnd += 10;
      else {
        if (monthEnd == 12) monthEnd++;
        else monthEnd -= 2;
      }
      //$scope.debugMsg = JSON.stringify($scope.selectedValues.dates.yearStart2 + "|" + $scope.selectedValues.dates.yearEnd2 + "] ["+ monthStart + " | " + monthEnd);
      if ($scope.selectedValues.dates.yearStart2 == $scope.selectedValues.dates.yearEnd2 && monthStart > monthEnd) {
        $scope.selectedValues.dates.monthEnd2 = $scope.selectedValues.dates.monthStart2;
      }
    }
    
    // $scope.selectedProject = updateJobs
    // $scope.selectedJobStatus = updateJobs
    
    $scope.selectedCatCode1 = function() {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      var jsKey = $scope.selectedValues.jobStatus.key;
      var jKey = $scope.selectedValues.job.key;
      var ccKey = $scope.selectedValues.optional.cat1.key;
      
      modalService.showDataLoadingModal();
      jobcostService.getCatCodeDescription(rType, dKey, cKey, pKey, jsKey, jKey, ccKey).then(function(data) {
        $scope.$apply(function() {
          $scope.filteredCC1Descriptions = [];
          if (data[0]) {
            $scope.filteredCC1Descriptions = data;
          }
          $scope.filteredCC1Descriptions.unshift($scope.allOptionValue);
          $scope.selectedValues.optional.cat1Description = $scope.allOptionValue;
          modalService.hideDataLoadingModal();
        });
      });
    }
    
    $scope.selectedCatCode2 = function() {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      var jsKey = $scope.selectedValues.jobStatus.key;
      var jKey = $scope.selectedValues.job.key;
      var ccKey = $scope.selectedValues.optional.cat2.key;
      
      modalService.showDataLoadingModal();
      jobcostService.getCatCodeDescription(rType, dKey, cKey, pKey, jsKey, jKey, ccKey).then(function(data) {
        $scope.$apply(function() {
          $scope.filteredCC2Descriptions = [];
          if (data[0]) {
            $scope.filteredCC2Descriptions = data;
          }
          $scope.filteredCC2Descriptions.unshift($scope.allOptionValue);
          $scope.selectedValues.optional.cat2Description = $scope.allOptionValue;
          modalService.hideDataLoadingModal();
        });
      });
    }
    
    /**
     * [selectedDetail updates period ui view depending on selection]
     */
    $scope.selectedDetail = function() {
      if ($scope.selectedValues.details.key < 4) {
        $("#datePanel1").show();
        $("#datePanel2").hide();
      }
      else {
        $("#datePanel1").hide();
        $("#datePanel2").show();
      }
    }
    
    /**
     * [selectedMonthStart updates end month when start date > end date]
     */
    $scope.selectedMonthStart = function() {
      // if($scope.selectedValues.dates.yearStart == $scope.selectedValues.dates.yearEnd && $scope.selectedValues.dates.monthStart.key > $scope.selectedValues.dates.monthEnd.key){
      //   $scope.selectedValues.dates.monthEnd = $scope.selectedValues.dates.monthStart;
      // }
    }
    
    //Set JDE Fiscal Years
    $scope.jdeYearChange = function() {
      var selectedDates = $scope.selectedValues.dates;
      if (selectedDates && selectedDates.jdeFiscalYear == "" && selectedDates.jdeYear != "") {
        var year = parseInt(selectedDates.jdeYear);
        selectedDates.jdeFiscalYear = year + "-" + (year + 1);
      }
    }
    
    //Open Calendar for JDE Years
    $scope.jdeYearClick = function() {
      $("#jdeCalendar").click();
    }
    
    /**
     * [selectedMonthStart updates end month when start date > end date]
     */
    $scope.selectedMonthStart2 = function() {
      //updatedMonths($scope.selectedValues.dates.monthStart2.key, $scope.selectedValues.dates.monthEnd2.key);
    }
    
    /**
     * [selectedMonthEnd updates start month when start date > end date]
     */
    $scope.selectedMonthEnd2 = function() {
      //updatedMonths($scope.selectedValues.dates.monthStart2.key, $scope.selectedValues.dates.monthEnd2.key);
    }
    
    //Set JDE Fiscal Years
    $scope.jdeYearChange2 = function() {
      var selectedDates = $scope.selectedValues.dates;
      if (selectedDates && selectedDates.jdeFiscalYear2 == "" && selectedDates.jdeYear2 != "") {
        var year = parseInt(selectedDates.jdeYear2);
        selectedDates.jdeFiscalYear2 = year + "-" + (year + 1);
      }
    }
    
    //Open Calendar for JDE Years
    $scope.jdeYearClick2 = function() {
      $("#jdeCalendar2").click();
    }
    
    $scope.getSheetData = function() {
      $scope.modalData.message = 'Loading...';
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      var jKey = $scope.selectedValues.job.key;
      var year = $scope.selectedValues.dates.jdeYear;
      var month = $scope.selectedValues.dates.monthStart.name;
      var jobStatus = $scope.selectedValues.jobStatus.key;
      var layout = $scope.selectedValues.details.name;
      var catField = $scope.selectedValues.optional.cat1.key;
      var catField1 = $scope.selectedValues.optional.cat2.key;
      var catCode = $scope.selectedValues.optional.cat1Description.key;
      var catCode1 = $scope.selectedValues.optional.cat2Description.key;
      
      var options = {
        projects: $scope.filteredProject,
        jobStatus: jobStatus,
        catField: catField,
        catField1: catField1,
        catCode: catCode,
        catCode1: catCode1
      }
      
      modalService.showReportLoadingModal();
      $scope.reportDetails.show = true;
      $scope.reportDetails.msg = "";
      $scope.reportDetails.name = "Jobcost-90";
      
      if ((layout + "").includes("Trend")) {
        var monthStart = $scope.selectedValues.dates.monthStart2.key;
        var monthEnd = $scope.selectedValues.dates.monthEnd2.key;
        var yearStart = $scope.selectedValues.dates.yearStart2;
        var yearEnd = $scope.selectedValues.dates.yearEnd2;
        jobcostService.getTrendSheetData(rType, monthStart, monthEnd, yearStart, yearEnd, dKey, cKey, pKey, jKey, layout, options)
          .then(function(data) {
            try {
              _.forEach(data.hiddenRows, function(child) {
                child.selected = false;
              });
              
              data.scope = $scope;
              trendService.insertTable(data, function(err, response) {
                $rootScope.$broadcast('reloadHiddenRows', {
                  rows: data.hiddenRows
                });
                modalService.hideReportLoadingModal();
              });
              
            }
            catch (e) {
              console.log(data);
            }
          });
      }
      else {
        jobcostService.getSheetData(rType, month, year, dKey, cKey, pKey, jKey, layout, options)
          .then(function(data) {
            try {
              _.forEach(data.hiddenRows, function(child) {
                child.selected = false;
              });
              
              if (data.sheetData.length > 5000) {
                $scope.modalData.message = "Loading " + data.sheetData.length + " records...";
              }
              
              data.scope = $scope;
              if (rType == 'ka') {
                jobcostService2.insertTable(data, function(err, response) {
                  $rootScope.$broadcast('reloadHiddenRows', {
                    rows: data.hiddenRows
                  });
                  modalService.hideReportLoadingModal();
                });
              }
              else {
                jobcostService.insertTable(data, function(err, response) {
                  $rootScope.$broadcast('reloadHiddenRows', {
                    rows: data.hiddenRows
                  });
                  modalService.hideReportLoadingModal();
                });
              }
            }
            catch (e) {
              console.log(data);
            }
          });
      }
    };
    
    buildPage();
  }
]);
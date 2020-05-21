app.service("jobcostService", [
  '$http',
  '$timeout',
  function($http, $timeout) {
    //var timeoutMs = $timeout( function(){}, 20000 );
    var formatPricing = '_(* #,##0.00_);_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingRed = '_(* #,##0.00_);[Red]_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingTotal = '_($* #,##0.00_);[Red]_($* (#,##0.00);_($* #,##0.00_);_(@_)';
    var noDataFound = ["No Data Found. Please change your selections and try again", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "];
    
    var requestRetry = function(method) {
      return new Promise(function(resolve, reject) {
        async.retry({
          times: 3,
          interval: 500
        }, method, function(err, result) {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };
    
    this.getReportData = function(type) {
      var makeRequest = function(cb) {
        console.log("Fetching Jobcost Data, Type: '" + type + "'");
        var query = getQueryType(type);
        
        $http.get("/ks2inc/job/ui/data" + query)
          .then(
            function(response) {
              cb(null, response.data);
            },
            function(httpError) {
              cb(httpError.status + " : " + httpError.data);
            }
          );
      }
      
      return requestRetry(makeRequest);
    };
    
    this.getCompanies = function(type, key) {
      var makeRequest = function(cb) {
        console.log("Fetching Jobcost Companies, Type: '" + type + "'");
        var query = getQueryType(type);
        
        $http.get("/ks2inc/job/companies/" + key + query)
          .then(
            function(response) {
              cb(null, response.data);
            },
            function(httpError) {
              cb(httpError.status + " : " + httpError.data);
            }
          );
      }
      
      return requestRetry(makeRequest);
    };
    
    this.getProjects = function(type, departmentKey, companyKey) {
      var makeRequest = function(cb) {
        console.log("Fetching Jobcost Projects, Type: '" + type + "'");
        var query = getQueryType(type);
        
        $http.get("/ks2inc/job/project/" + departmentKey + "/" + companyKey + query)
          .then(
            function(response) {
              cb(null, response.data);
            },
            function(httpError) {
              cb(httpError.status + " : " + httpError.data);
            }
          );
      }
      
      return requestRetry(makeRequest);
    };
    
    this.getJobs = function(type, departmentKey, companyKey, projectKey) {
      console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
      var query = getQueryType(type);
      return this.getJobsAPIRequest("/ks2inc/job/" + departmentKey + "/" + companyKey + "/" + projectKey + query);
    }
    
    this.getJobWithStatus = function(type, departmentKey, companyKey, projectKey, jobStatusKey) {
      console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
      var query = getQueryType(type);
      query += "&jobstatus=" + jobStatusKey;
      return this.getJobsAPIRequest("/ks2inc/job/" + departmentKey + "/" + companyKey + "/" + projectKey + query);
    };
    
    this.getJobsAPIRequest = function(url) {
      var makeRequest = function(cb) {
        $http.get(url)
          .then(
            function(response) {
              cb(null, response.data);
            },
            function(httpError) {
              cb(httpError.status + " : " + httpError.data);
            }
          );
      }
      
      return requestRetry(makeRequest);
    };
    
    this.getCatCodeDescription = function(type, departmentKey, companyKey, projectKey, jobStatusKey, jobKey, catCodeKey) {
      var makeRequest = function(cb) {
        console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
        var query = getQueryType(type);
        
        $http.get("/ks2inc/job/code/detail/" + departmentKey + "/" + companyKey + "/" + projectKey + "/" + jobStatusKey + "/" + jobKey + "/" + catCodeKey + query)
          .then(
            function(response) {
              cb(null, response.data);
            },
            function(httpError) {
              cb(httpError.status + " : " + httpError.data);
            }
          );
      }
      
      return requestRetry(makeRequest);
    };
    
    /**
     * Get data for the spreadsheet
     * @param  {string} type          Type of spreadsheet
     * @param  {string} departmentKey 
     * @param  {string} companyKey    
     * @param  {string} projectKey    
     * @param  {string} jobKey        
     * @param  {object} options       Object containing the data for new and ka jobcosts
     *                                { status: jobStatus, catField, catField1, catCode, catCode1 }
     * @return {promise}              Promise from the $http request
     */
    this.getSheetData = function(type, month, year, departmentKey, companyKey, projectKey, jobKey, layout, options, removeSubtotals) {
      var makeRequest = function(cb) {
        var requestData = {
          reportSelected: type,
          month: month,
          year: year,
          layout: layout,
          department: departmentKey,
          company: companyKey,
          project: projectKey,
          job: jobKey,
          projectList: options.projects,
          removeSubtotals: removeSubtotals
        };
        
        if (type === 'new' || type === 'ka') {
          requestData.status = options.jobStatus;
          requestData.catField = options.catField;
          requestData.catField1 = options.catField1;
          requestData.catCode = options.catCode;
          requestData.catCode1 = options.catCode1;
        }
        
        return $http.post('/ks2inc/job/sheet/data', JSON.stringify(requestData), {
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(function(response) {
              cb(null, response.data);
            },
            function(httpError) {
              cb(httpError.status + " : " + httpError.data);
            });
      };
      
      return requestRetry(makeRequest);
    };
    
    /**
     * Get data for the spreadsheet
     * @param  {string} type          Type of spreadsheet
     * @param  {string} departmentKey 
     * @param  {string} companyKey    
     * @param  {string} projectKey    
     * @param  {string} jobKey        
     * @param  {object} options       Object containing the data for new and ka jobcosts
     *                                { status: jobStatus, catField, catField1, catCode, catCode1 }
     * @return {promise}              Promise from the $http request
     */
    this.getTrendSheetData = function(type, monthStart, monthEnd, yearStart, yearEnd, departmentKey, companyKey, projectKey, jobKey, layout, options) {
      var makeRequest = function(cb) {
        var requestData = {
          reportSelected: type,
          monthStart: monthStart,
          monthEnd: monthEnd,
          yearStart: yearStart,
          yearEnd: yearEnd,
          layout: layout,
          department: departmentKey,
          company: companyKey,
          project: projectKey,
          job: jobKey,
          projectList: options.projects,
        };
        
        requestData.status = options.jobStatus;
        requestData.catField = options.catField;
        requestData.catField1 = options.catField1;
        requestData.catCode = options.catCode;
        requestData.catCode1 = options.catCode1;
        
        return $http.post('/ks2inc/job/sheet/data', JSON.stringify(requestData), {
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(function(response) {
              cb(null, response.data);
            },
            function(httpError) {
              cb(httpError.status + " : " + httpError.data);
            });
      };
      
      return requestRetry(makeRequest);
    };
    
    function getQueryType(type) {
      if (type === 'ka') {
        return '?type=ka'
      }
      else if (type === 'e') {
        return '?type=e'
      }
      else if (type === 'new') {
        return '?type=new'
      }
      return '';
    }
    
    this.insertTable = function(data, cb) {
      try {
        data.error = {};
        if (data.sheetData.length == 0) {
          async.waterfall([
            function(next) {
              var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
              data.sheetData = noDataFound;
              data.alphabetRangeValue = alphabet[data.sheetData[0].length - 1];
              data.headerOffset = 6;
              data.alphabet = alphabet;
              data.isEmpty = true;
              
              data.layout = data.scope.selectedValues.details.name;
              data.budgetStart = 'G';
              data.budgetEnd = 'K';
              if (data.layout == "No Details") {
                data.budgetStart = 'E';
                data.budgetEnd = 'I';
              }
              next(null, data);
            },
            deleteWorkSheets,
            loadWorkSheets,
            findWorkSheet,
            initalizeWorkSheet,
            clearSheet,
            setHeader,
            addEmptyTableRows,
            removeOldSheet
          ], cb);
        }
        else {
          async.waterfall([
            function(next) {
              var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
              if (data.sheetData.length > 0)
                data.alphabetRangeValue = alphabet[data.sheetData[0].length - 1];
              data.headerOffset = 6;
              data.alphabet = alphabet;
              data.isEmpty = false;
              
              data.layout = data.scope.selectedValues.details.name;
              data.budgetStart = 'G';
              data.budgetEnd = 'K';
              if (data.layout == "No Details") {
                data.budgetStart = 'E';
                data.budgetEnd = 'I';
              }
              if (data.sheetData.length > 5000) {
                data.scope.modalData.message = 'This is going to take a while...';
              }
              next(null, data);
            },
            deleteWorkSheets,
            loadWorkSheets,
            findWorkSheet,
            initalizeWorkSheet,
            clearSheet,
            setHeader,
            createTable,
            addTableHeader,
            //insertDataToWorkSheet,
            addTableRows,
            addFilter,
            hideRows,
            addFormatting,
            addSubTotal,
            addGrandTotal,
            removeOldSheet
            //insertData
          ], cb);
        }
      }
      catch (e) {
        cb(e);
      }
    };
    
    var removeOldSheet = function(data, next) {
      var deletePlaceholder = function(cb) {
        Excel.run(function(ctx) {
          var worksheets = ctx.workbook.worksheets.load('name');
          var worksheet = worksheets.getItem('report-' + data.dummySheetName);
          worksheet.delete();
          
          //Hidden JSON Data
          var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var jsonDataRange = sheet.getRange(data.hiddenRowsData.header);
          jsonDataRange.load('values');
          jsonDataRange.values = [data.hiddenRowsData.json];
          jsonDataRange.format.font.color = 'white';
          jsonDataRange.format.horizontalAlignment = 'Fill';
          jsonDataRange.format.columnWidth = 60;
          
          return ctx.sync()
            .then(function(response) {
              cb(null, data);
            }).catch(function(err) {
              cb(err);
            });
        });
      }
      
      async.retry({
        times: 2,
        interval: 300
      }, deletePlaceholder, function(err, data) {
        next(null, data);
      });
    }
    
    var deleteWorkSheets = function(data, next) {
      Excel.run(function(ctx) {
        var sheets = ctx.workbook.worksheets;
        var worksheet = sheets.add();
        var date = new Date();
        data.dummySheetName = date.getTime();
        worksheet.name = 'report-' + data.dummySheetName;
        worksheet.load("name, position");
        worksheet.activate();
        sheets.load("items");
        var count = ctx.workbook.worksheets.getCount();
        return ctx.sync()
          .then(function(response) {
            var sheets = ctx.workbook.worksheets;
            sheets.load("items");
            var ids = _.map(sheets.items, function(sheet) {
              return sheet.id
            });
            _.forEach(ids, function(id, key) {
              var ws = ctx.workbook.worksheets.getItem(id);
              if (key < ids.length - 1)
                ws.delete();
            });
            
            return ctx.sync()
              .then(function(response) {
                next(null, data);
              }).catch(function(err) {
                next(null, data);
              });
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'deleteWorkSheets';
            next(null, data);
          });
      });
    }
    
    var loadWorkSheets = function(data, next) {
      Excel.run(function(ctx) {
        var sheets = ctx.workbook.worksheets;
        sheets.load("items");
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        activeWorksheet.load('name');
        
        return ctx.sync()
          .then(function(response) {
            data.sheets = sheets;
            data.activeSheet = activeWorksheet.name;
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'loadWorkSheets';
            next(null, data);
          });
      });
    };
    
    var findWorkSheet = function(data, next) {
      var allWorksheets = data.sheets;
      Excel.run(function(ctx) {
        var dataCreated = false;
        var dataSheetName = 'Jobcost-90';
        
        _.forEach(data.sheets.items, function(sheet) {
          if (sheet.name == dataSheetName) {
            dataCreated = true;
          }
        });
        
        return ctx.sync()
          .then(function(response) {
            data.dataSheetName = dataSheetName;
            data.dataCreated = dataCreated;
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'findWorkSheet';
            next(null, data);
          });
      });
    }
    
    var initalizeWorkSheet = function(data, next) {
      if (!data.dataCreated) {
        Excel.run(function(ctx) {
          var worksheets = ctx.workbook.worksheets;
          var worksheet = worksheets.add();
          worksheet.name = data.dataSheetName;
          worksheet.load("name, position");
          
          worksheet.activate();
          
          return ctx.sync()
            .then(function() {
              next(null, data);
            }).catch(function(err) {
              data.error.msg = err;
              data.error.stage = 'initalizeWorkSheet';
              next(null, data);
            });
        });
      }
      else next(null, data);
    }
    
    var setHeader = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var recordCount = data.sheetData === noDataFound ? "None" : data.sheetData.length;
        var reportType = data.scope.selectedValues.report.type;
        
        var header = [];
        if(reportType == "new"){
          var catCodes = data.scope.selectedValues.optional;
          header = [
            ['', '', '', 'City of Denton - Job Cost Summary', '', '', 'Dept:', data.scope.selectedValues.department.name, 'Month:', data.scope.selectedValues.dates.monthStart.name, 'Cat Code 1:', catCodes.cat1.name],
            ['', '', '', moment().format('MM/DD/YYYY, h:mm:ss a'), '', '', 'Company:', data.scope.selectedValues.company.name, 'JDE Fiscal Year:', data.scope.selectedValues.dates.jdeYear + ' - ' + (parseInt(data.scope.selectedValues.dates.jdeYear) + 1), 'Cat Code Value 1:', catCodes.cat1Description.name],
            ['', '', '', 'Unaudited/Unofficial-Not intended for public distribution', '', '', 'Project:', data.scope.selectedValues.project.name, 'Layout:', data.layout, 'Cat Code 2:', catCodes.cat2.name],
            ['', '', '', '', '', '', 'Job:', data.scope.selectedValues.job.name, 'Records:', recordCount, 'Cat Code Value 2:', catCodes.cat2Description.name]
          ];

          var reportRangeHeader2 = worksheet.getRange('K1:K4');
          reportRangeHeader2.format.font.color = '#174888';
          reportRangeHeader2.format.font.bold = true;
        }
        else header = [
          ['', '', '', 'City of Denton - Job Cost Summary', '', '', 'Dept:', data.scope.selectedValues.department.name, 'Month:', data.scope.selectedValues.dates.monthStart.name, '', ''],
          ['', '', '', moment().format('MM/DD/YYYY, h:mm:ss a'), '', '', 'Company:', data.scope.selectedValues.company.name, 'JDE Fiscal Year:', data.scope.selectedValues.dates.jdeYear + ' - ' + (parseInt(data.scope.selectedValues.dates.jdeYear) + 1), '', ''],
          ['', '', '', 'Unaudited/Unofficial-Not intended for public distribution', '', '', 'Project:', data.scope.selectedValues.project.name, 'Layout:', data.layout, '', ''],
          ['', '', '', '', '', '', 'Job:', data.scope.selectedValues.job.name, 'Records:', recordCount, '', '']
        ];
        
        var range = worksheet.getRange('A1:L4');
        range.load('values');
        range.values = header;
        
        var headerRange = worksheet.getRange('A1:C4');
        headerRange.format.font.color = 'white';
        headerRange.merge(true);
        
        var spaceRange = worksheet.getRange('A5:K5');
        spaceRange.merge(true);
        
        var titleSection = worksheet.getRange('D1:D2');
        titleSection.format.font.color = '#174888';
        
        var titleCell = worksheet.getRange('D1');
        titleCell.format.font.bold = true;
        
        var infoCell = worksheet.getRange('D3');
        infoCell.format.font.color = 'red';
        infoCell.format.font.italic = true;
        
        var reportheaders = worksheet.getRange('G1:G4');
        reportheaders.format.font.color = '#174888';
        reportheaders.format.font.bold = true;
        reportheaders.format.horizontalAlignment = 'Right';
        reportheaders = worksheet.getRange('H1:H4');
        reportheaders.format.horizontalAlignment = 'Left';
        
        var reportRangeHeader = worksheet.getRange('I1:I4');
        reportRangeHeader.format.font.color = '#174888';
        reportRangeHeader.format.font.bold = true;
        reportRangeHeader.format.horizontalAlignment = 'Right';
        reportRangeHeader = worksheet.getRange('J1:J4');
        reportRangeHeader.format.horizontalAlignment = 'Left';
        
        
        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        
        worksheet.freezePanes.freezeRows(6);
        return ctx.sync()
          .then(function(res) {
            data.header = header;
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'setHeader';
            next(null, data);
          });
      });
    };
    
    var clearSheet = function(data, next) {
      Excel.run(function(ctx) {
        var ws = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var range = ws.getUsedRange();
        range.clear();
        
        return ctx.sync()
          .then(function(res) {
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'clearSheet';
            next(null, data);
          })
      })
    }
    
    var createTable = function(data, next) {
      Excel.run(function(ctx) {
        var range = '\'' + data.dataSheetName + '\'!A' + data.headerOffset + ':' + data.alphabetRangeValue + (data.headerOffset + data.sheetData.length);
        var table = ctx.workbook.tables.add(range, true);
        table.load('name');
        
        return ctx.sync()
          .then(function(response) {
            data.tableName = table.name;
            data.tableId = table.id;
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'createTable';
            next(null, data);
          });
      });
    }
    
    var addTableHeader = function(data, next) {
      Excel.run(function(ctx) {
        var tables = ctx.workbook.tables;
        var tableHeader = tables.getItem(data.tableName).getHeaderRowRange();
        if (data.layout == "No Details") {
          tableHeader.values = [
            ["Dept", "Company", "Project", "Bus Unit", "Budget", "Expenditures", "Remaining", "Encumbrances", "Unencumbered"]
          ];
        }
        else tableHeader.values = [
          ["Dept", "Company", "Project", "Bus Unit", "Object", "Subsidary", "Budget", "Expenditures", "Remaining", "Encumbrances", "Unencumbered"]
        ];
        tableHeader.format.horizontalAlignment = 'Center';
        
        return ctx.sync()
          .then(function(response) {
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'addTableHeader';
            next(null, data);
          });
      });
    }
    
    var addEmptyTableRows = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var messageData = [
          ["No Data Found. Please change your selections and try again", "", "", "", "", "", "", "", "", "", ""]
        ];
        var messageRange = worksheet.getRange('A6:K6');
        messageRange.merge(true);
        messageRange.load('values');
        messageRange.values = messageData;
        
        return ctx.sync()
          .then(function(response) {
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'addEmptyTableRows';
            next(null, data);
          });
      });
    };
    
    var addTableRows = function(data, next) {
      var splitLen = 40;
      var chunk = data.sheetData.length;
      var split = [data.sheetData];
      var water = [];
      
      if (data.sheetData.length > 5000) {
        chunk = 200;
        split = _.chunk(data.sheetData, chunk);
      }
      
      var j = 0;
      
      for (var i = 0; i < split.length; i++) {
        water.push(function(cb) {
          Excel.run(function(ctx) {
            var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
            
            if (split.length > 1 && j === (split.length - 1)) {
              var range = 'A' + (chunk * (j - 1) + split[j - 1].length + data.headerOffset + 1) + ':' + data.budgetEnd + (chunk * j + split[j].length + data.headerOffset);
              sheet.getRange(range).values = split[j];
            }
            else {
              var rangeAddress = 'A' + (chunk * j + data.headerOffset + 1) + ':' + data.budgetEnd + (chunk * j + split[j].length + data.headerOffset);
              var range = sheet.getRange(rangeAddress);
              range.format.font.color = 'black';
              range.format.font.bold = false;
              range.values = split[j];
            }
            
            data.scope.$apply(function() {
              if ((j + 1) * chunk > data.sheetData.length) {
                data.scope.modalData.message = 'Loading ' + data.sheetData.length + ' rows of ' + data.sheetData.length;
              }
              else {
                data.scope.modalData.message = 'Loading ' + (j + 1) * chunk + ' rows of ' + data.sheetData.length;
              }
            });
            j++;
            
            return ctx.sync()
              .then(function(response) {
                cb(null);
              }).catch(function(err) {
                cb(null);
              });
          });
        });
      }
      
      async.waterfall(water, function(err, res) {
        data.error.msg = err;
        data.error.stage = 'addTableRows';
        next(null, data);
      })
      
      // I'm keeping this here for reference. This method below is much faster and the only reason we do it the way we do above is because the online Excel sucks.
      /*
      Excel.run(function (ctx) {
        var splitLen = 40;
        var chunk = data.sheetData.length;
        var split = [data.sheetData];

        if (data.sheetData.length > 5000) {
          chunk = 200;
          split = _.chunk(data.sheetData, chunk);
        }

        var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var table = ctx.workbook.tables.getItem(data.tableName);

        data.scope.debugMsg = '';
        for(var i = 0; i < split.length; i++) {
          if (split.length > 1 && i === (split.length - 1)) {
            var range = 'A' + (chunk * (i - 1) + split[i-1].length + data.headerOffset + 1) + ':K' + (chunk*i + split[i].length + data.headerOffset);
            sheet.getRange(range).values = split[i];
            //table.rows.add((chunk * (i - 1) + split[i-1].length), split[i]);
          } else if (split[i].length && split[i].length > 0) {
            var rangeAddress = 'A' + (chunk*i + data.headerOffset + 1) + ':K' + (chunk*i + split[i].length + data.headerOffset);
            var range = sheet.getRange(rangeAddress);
            data.scope.$apply(function () {
              data.scope.debugMsg += rangeAddress + '';
            });
            range.values = split[i];
            //sheet.getRange(range).values = split[i];
            //table.rows.add((chunk * i), split[i]);
          }
        }

        //table.getDataBodyRange().values = data.sheetData;

        return ctx.sync()
          .then(function (response) {
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
      */
    }
    
    var addSubTotal = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        
        _.forEach(data.subTotalRows, function(val) {
          var numberRange = worksheet.getRange('E' + val + ':K' + val);
          var range = worksheet.getRange('A' + val + ':Z' + val);
          range.format.font.color = 'blue';
          range.format.font.bold = true;
          numberRange.numberFormat = [_.fill(Array(7), formatPricingRed)];
        });
        
        return ctx.sync()
          .then(function(response) {
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'addSubTotal';
            next(null, data);
          });
      });
    }
    
    var addFilter = function(data, next) {
      Excel.run(function(ctx) {
        var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var table = sheet.tables.getItem(data.tableName);
        var tableBody = table.getDataBodyRange();
        
        tableBody.format.fill.color = 'white';
        //rangeTitles.format.font.bold = true;
        
        // _.forEach(data.hiddenRows, function (rowData) {
        //   var row = rowData.rows.substring(1, rowData.rows.length-1);
        //   var rowRange = worksheet.getRange("A"+row+":Z"+row);
        //   rowRange.format.font.bold = true;
        // });
        return ctx.sync()
          .then(function(response) {
            //data.tableName = table.name;
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'addFilter';
            next(null, data);
          });
      });
    }
    
    var addFormatting = function(data, next) {
      if (data.sheetData.length > 5000) {
        var len = data.sheetData.length + data.headerOffset;
        var formatArray = _.fill(Array(len), _.fill(Array(5), formatPricing));
        var chunk = 200;
        var split = _.chunk(formatArray, chunk);
        var water = [];
        var j = 0;
        
        for (var i = 0; i < split.length; i++) {
          water.push(function(cb) {
            Excel.run(function(ctx) {
              var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
              
              if (split.length > 1 && j === (split.length - 1)) {
                var range = data.budgetStart + (chunk * (j - 1) + split[j - 1].length + data.headerOffset + 1) + ':' + data.alphabetRangeValue + (chunk * j + split[j].length + data.headerOffset);
                sheet.getRange(range).numberFormat = split[j];
              }
              else {
                var rangeAddress = data.budgetStart + (chunk * j + data.headerOffset + 1) + ':' + data.alphabetRangeValue + (chunk * j + split[j].length + data.headerOffset);
                var range = sheet.getRange(rangeAddress);
                
                range.numberFormat = split[j];
              }
              
              data.scope.$apply(function() {
                if ((j + 1) * chunk > data.sheetData.length) {
                  data.scope.modalData.message = 'Formatting ' + data.sheetData.length + ' rows of ' + data.sheetData.length;
                }
                else {
                  data.scope.modalData.message = 'Formatting ' + (j + 1) * chunk + ' rows of ' + data.sheetData.length;
                }
              });
              
              j++;

              if(i+1 >= split.length) {
                var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
                var len = data.sheetData.length + data.headerOffset;
                //worksheet.getUsedRange().format.autofitColumns();

                var range = worksheet.getRange(data.budgetStart + (data.headerOffset+1) + ':' + data.budgetEnd + len);
                range.format.horizontalAlignment = 'Right';
              }
              
              return ctx.sync()
                .then(function(response) {
                  cb(null);
                }).catch(function(err) {
                  cb(null);
                });
            });
          });
        }
        async.waterfall(water, function(err, res) {
          data.error.msg = err;
          data.error.stage = 'addFormatting';
          next(null, data);
        });
        
      }
      else {
        Excel.run(function(ctx) {
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var len = data.sheetData.length + data.headerOffset;
          var numberRange = worksheet.getRange(data.budgetStart + '7:' + data.alphabetRangeValue + len)
          numberRange.numberFormat = _.fill(Array(data.sheetData.length), _.fill(Array(5), formatPricing));
          //worksheet.getUsedRange().format.autofitColumns();

          var range = worksheet.getRange(data.budgetStart + (data.headerOffset+1) + ':' + data.budgetEnd + len);
          range.format.horizontalAlignment = 'Right';
          return ctx.sync()
            .then(function(response) {
              //data.tableName = table.name;
              next(null, data);
            }).catch(function(err) {
              data.error.msg = err;
              data.error.stage = 'addFormatting';
              next(null, data);
            });
        });
      }
    }
    
    /**
     * Insert data into spreadsheet
     * @depricated             This function is depricated
     * 
     * @param  {object}   data Data object from the getSheetData call
     * @param  {Function} cb   Callback function
     * @return {(err, data)}   Data and error object form async call
     */
    this.insertSpreadSheetData = function(data, cb) {
      // Callback with (err, result)
      try {
        async.waterfall([
          function(next) {
            next(null, data);
          },
          deleteWorkSheets,
          loadWorkSheets,
          findWorkSheet,
          initalizeWorkSheet,
          hideRows,
          insertDataToWorkSheet,
          setSubTotalFormat,
          addGrandTotal,
          setHeader,
        ], cb);
      }
      catch (e) {
        cb(e);
      }
    };
    
    var hideRows = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        
        var fullrange = worksheet.getRange('A1:Z1000');
        fullrange.rowHidden = false;
        
        _.forEach(data.hiddenRows, function(rowData) {
          var range = worksheet.getRange(rowData.range);
          range.rowHidden = true;
        });
        
        return ctx.sync()
          .then(function() {
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'insertSpreadSheetData';
            next(null, data);
          });
      });
    };
    
    var insertDataToWorkSheet = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var range = 'O';
        var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        if (data.sheetData.length > 0)
          var alphabetRangeValue = alphabet[data.sheetData[0].length - 1];
        
        //var fullrange = worksheet.getRange();
        //fullrange.load('values');
        //fullrange.clear();
        _.forEach(data.hiddenRows, function(rowData) {
          var row = rowData.rows.substring(1, rowData.rows.length - 1);
          var rowRange = worksheet.getRange("A" + row + ":Z" + row);
          rowRange.format.font.bold = true;
        });
        
        var headerOffset = 7;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var range = worksheet.getRange('A' + headerOffset + ':' + alphabetRangeValue + sheetLength)
        range.load('values')
        range.values = data.sheetData
        //range.format.autofitColumns();
        
        var numberRange = worksheet.getRange(data.budgetStart + headerOffset + ':' + alphabetRangeValue + sheetLength)
        numberRange.numberFormat = _.fill(Array(data.sheetData.length), _.fill(Array(5), formatPricing));
        return ctx.sync()
          .then(function(res) {
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'insertDataToWorkSheet';
            next(null, data);
          });
      });
    };
    
    var setSubTotalFormat = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        
        _.forEach(data.subTotalRows, function(val) {
          var numberRange = worksheet.getRange('E' + val + ':K' + val);
          var range = worksheet.getRange('A' + val + ':Z' + val);
          range.format.font.color = 'blue';
          range.format.font.bold = true;
          numberRange.numberFormat = [_.fill(Array(7), formatPricingRed)];
        });
        
        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var range = worksheet.getRange('E' + headerOffset + ':K' + sheetLength)
        range.format.columnWidth = 110;
        
        return ctx.sync()
          .then(function(res) {
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'setSubTotalFormat';
            next(null, data);
          });
      })
    };
    
    var addGrandTotal = function(data, next) {
      Excel.run(function(ctx) {
        var headerOffset = 6;
        var length = headerOffset + data.sheetData.length;
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

        if(!data.removeSubtotals){
          var grandTotalData = [
            ['=SUBTOTAL(9,G7:G' + (length) + ')', '=SUBTOTAL(9,H7:H' + (length) + ')', '=SUBTOTAL(9,I7:I' + (length) + ')', '=SUBTOTAL(9,J7:J' + (length) + ')', '=SUBTOTAL(9,K7:K' + (length) + ')']
          ];
          
          if (data.layout == "No Details") {
            grandTotalData = [
              ['=SUBTOTAL(9,E7:E' + (length) + ')', '=SUBTOTAL(9,F7:F' + (length) + ')', '=SUBTOTAL(9,G7:G' + (length) + ')', '=SUBTOTAL(9,H7:H' + (length) + ')', '=SUBTOTAL(9,I7:I' + (length) + ')']
            ];
          }
          
          var grandRange = worksheet.getRange('D' + (length + 1));
          grandRange.load('values');
          grandRange.values = "Grand Total";
          grandRange.format.font.bold = true;
          grandRange.format.font.color = '#00037B';
          
          var range = worksheet.getRange(data.budgetStart + (length + 1) + ':' + data.budgetEnd + (length + 1));
          range.load('values');
          range.values = grandTotalData;
          range.numberFormat = [_.fill(Array(5), formatPricingTotal)];
          range.format.font.bold = true;
          range.format.font.color = '#00037B';
          length++;
        }
        worksheet.getUsedRange().format.autofitColumns();
        
        //Set Print Settings
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        activeWorksheet.pageLayout.orientation = Excel.PageOrientation.landscape;
        activeWorksheet.pageLayout.setPrintTitleRows("$1:$6");
        activeWorksheet.pageLayout.zoom = { scale: 65 };
        if (data.layout == "No Details") activeWorksheet.pageLayout.setPrintArea("$A$1:$J$"+length);
        else activeWorksheet.pageLayout.setPrintArea("$A$1:$K$"+length);
        
        const inchPoint = 72;
        activeWorksheet.pageLayout.topMargin = 0.25 * inchPoint;
        activeWorksheet.pageLayout.bottomMargin = 0.5 * inchPoint;
        activeWorksheet.pageLayout.rightMargin = 0.2 * inchPoint;
        activeWorksheet.pageLayout.leftMargin = 0.2 * inchPoint;
        activeWorksheet.pageLayout.headerMargin = 0.25 * inchPoint;
        activeWorksheet.pageLayout.footerMargin = 0.25 * inchPoint;

        var headerFooter = activeWorksheet.pageLayout.headersFooters.defaultForAllPages;
        headerFooter.leftFooter = data.dataSheetName;
        headerFooter.centerFooter = "Page &P of &N";
        headerFooter.rightFooter = "&D &B& &I&B&T";
        

        return ctx.sync()
          .then(function(res) {
            next(null, data);
          }).catch(function(err) {
            data.error.msg = err;
            data.error.stage = 'addGrandTotal';
            next(null, data);
          });
      });
    };
  }
  
]);
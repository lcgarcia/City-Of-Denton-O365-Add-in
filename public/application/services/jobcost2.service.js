app.service("jobcostService2", [
  '$http',
  '$timeout',
  function($http, $timeout){
    //var timeoutMs = $timeout( function(){}, 20000 );
    var formatPricing = '_(* #,##0.00_);_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingRed = '_(* #,##0.00_);[Red]_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingTotal = '_($* #,##0.00_);[Red]_($* (#,##0.00);_($* #,##0.00_);_(@_)';

    this.insertTable = function (data, cb) {
      try {
        if(data.sheetData.length == 0){
          async.waterfall([
            function (next) {
              var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
              data.sheetData = ["No Data Found. Please change your selections amd try again"," "," "," "," "," "," "," "," "," "," "];
              data.alphabetRangeValue = alphabet[data.sheetData[0].length-1];
              data.headerOffset = 6;
              data.alphabet = alphabet;
              data.isEmpty = true;
              next(null, data);
            },
            loadWorkSheets,
            findWorkSheet,
            initalizeWorkSheet,
            clearSheet,
            setHeader,
            createTable,
            addTableHeader,
            addEmptyTableRows
          ], cb);
        }
        else{
          async.waterfall([
            function (next) {
              var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
              if (data.sheetData.length > 0)
                data.alphabetRangeValue = alphabet[data.sheetData[0].length-1];
              data.headerOffset = 6;
              data.alphabet = alphabet;
              data.isEmpty = false;
              if (data.sheetData.length > 5000) {
                data.scope.modalData.message = 'This is going to take a while...';
              }
              next(null, data);
            },
            //deleteWorkSheets,
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
            addSubTotal,
            addGrandTotal,
            addFormatting
            //removeOldSheet,
            //insertData
          ], cb);
        }
      } catch (e) {
        //USED FOR TESTING ERROR START
        var errData = worksheet.getRange('M2');
        errData.load("values");
        errData.values = JSON.stringify("ERROOOORRR!!");
        //USED FOR TESTING ERROR END
        cb(e);
      }
    };

    var removeOldSheet = function (data, next) {
      var deletePlaceholder = function (cb) {
        Excel.run(function (ctx) {
          var worksheets = ctx.workbook.worksheets.load('name');
          var worksheet = worksheets.getItem('report-' + data.dummySheetName);
          worksheet.delete();
          
          return ctx.sync()
            .then(function(response) {
              cb(null, data);  
            }).catch(function (err) {
              cb(err);
            });
        });
      }

      async.retry({times: 2, interval: 300}, deletePlaceholder, function(err, data) {
        next(null, data);
      });
    }

    var deleteWorkSheets = function (data, next) {
      Excel.run(function (ctx) {
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
            var ids = _.map(sheets.items, function(sheet) { return sheet.id });
            _.forEach(ids, function (id, key) {
              var ws = ctx.workbook.worksheets.getItem(id);
              if (key < ids.length - 1) 
                ws.delete();
            });
           
            return ctx.sync()
            .then(function (response) {
              next(null, data);  
            }).catch(function (err) {
              next(null, data);
            });
          }).catch(function (err) {
            next(err);
          });
      });
    }

    var loadWorkSheets = function (data, next) {
      Excel.run(function (ctx) {
        var sheets = ctx.workbook.worksheets;
        sheets.load("items");
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        activeWorksheet.load('name');

        return ctx.sync()
          .then(function(response) {
            data.sheets = sheets;
            data.activeSheet = activeWorksheet.name;
            next(null, data);
          }).catch(function (err) {
            next(err);
          });
      });
    };

    var findWorkSheet = function (data, next) {
      var allWorksheets = data.sheets;
      Excel.run(function (ctx) {
        var dataCreated = false;
        var dataSheetName = 'Jobcost-90'
        
        _.forEach(data.sheets.items, function (sheet) {
          if(sheet.name == dataSheetName)
            dataCreated = true;
        });

        return ctx.sync()
          .then(function (response) {
            data.dataSheetName = dataSheetName;
            data.dataCreated = dataCreated;
            next(null, data);
          }).catch(function (err) {
            next(err);
          });
      });
    }

    var initalizeWorkSheet = function (data, next) {
      if(!data.dataCreated){
        Excel.run(function (ctx) {
          var worksheets = ctx.workbook.worksheets;
          var worksheet = worksheets.add();
          worksheet.name = data.dataSheetName;
          worksheet.load("name, position");

          worksheet.activate();
          worksheets.load("items, name");
          return ctx.sync()
          .then(function () {
            var sheetMap = _.map(ctx.workbook.worksheets.items, function(sheet) { return sheet.id });
            _.forEach(sheetMap, function (id, key) {
              var ws = worksheets.getItem(id);
              if ( key != sheetMap.length - 1 )
                ws.delete();
            });
           
            return ctx.sync()
            .then(function (response) {
              next(null, data);  
            }).catch(function (err) {
              next(null, data);
            });
          }).catch(function (err) {
            next(null, data);
          });
        });
      } else {
        Excel.run(function (ctx) {
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var worksheets = ctx.workbook.worksheets;
          worksheets.load("items");
          return ctx.sync()
          .then(function () {
            var sheetMap = _.map(ctx.workbook.worksheets.items, function(sheet) { return sheet.id });

            _.forEach(sheetMap, function (id, key) {
              if (id != worksheet.id) {
                var ws = worksheets.getItem(id);
                ws.delete();
              };
            });
           
            return ctx.sync()
            .then(function (response) {
              next(null, data);  
            }).catch(function (err) {
              next(null, data);
            });
          }).catch(function (err) {
            next(null, data);
          });
        });
      }
    }

    var setHeader = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var jsonHiddenData = JSON.stringify(data.hiddenRows);

        var header = [
          ['', '', '', 'City of Denton - Job Cost Summary', '', '', 'Dept:', data.scope.selectedValues.department.name, 'Month:', data.scope.selectedValues.dates.monthStart.name, '', ''],
          [data.hiddenRows.length > 1000 ? '' : jsonHiddenData, '', '', moment().format('MM/DD/YYYY, h:mm:ss a'), '', '', 'Company:', data.scope.selectedValues.company.name, 'JDE Fiscal Year:', data.scope.selectedValues.dates.jdeYear + ' - ' + (parseInt(data.scope.selectedValues.dates.jdeYear)+1), '', ''],
          ['', '', '', 'Unaudited/Unofficial-Not intended for public distribution', '', '', 'Project:', data.scope.selectedValues.project.name, 'Layout:', 'Cost Code/Type Details', '', ''],
          ['', '', '', '', '', '', 'Job:', data.scope.selectedValues.job.name, '', '', '', ''],
          ["Dept", "Company", "Project Manager", "Project", "Bus Unit", "Object", "Subsidary", "Budget", "Expendatures", "Remaining", "Encumbrances", "Unencumbered"]
        ];

        //USED FOR TESTING 
        // var sqlData = worksheet.getRange('N1');
        // sqlData.load("values");
        // sqlData.values = JSON.stringify(data.subTotalRows);

        var range = worksheet.getRange('A1:L5');
        range.load('values');
        range.values = header;

        var jsonDataRange = worksheet.getRange('A1:C4');
        jsonDataRange.format.font.color = 'white';
        jsonDataRange.merge(true);

        var titleSection = worksheet.getRange('D1:D2');
        titleSection.format.font.color = '#174888';

        var titleCell = worksheet.getRange('D1');
        titleCell.format.font.bold = true;

        var infoCell = worksheet.getRange('D3');
        infoCell.format.font.color = 'red';
        infoCell.format.font.italic = true;

        var reportheaders = worksheet.getRange('H1:G4');
        reportheaders.format.font.color = '#174888';
        reportheaders.format.font.bold = true;

        var reportRangeHeader = worksheet.getRange('I1:I4');
        reportRangeHeader.format.font.color = '#174888';
        reportRangeHeader.format.font.bold = true;

        var tableHeader = worksheet.getRange('A5:L5');
        tableHeader.format.fill.color = '#174888';
        tableHeader.format.font.color = 'white';
        if(data.isEmpty) tableHeader.rowHidden = false;
        else tableHeader.rowHidden = true;

        var leftColumns = worksheet.getRange('A:C');
        leftColumns.format.horizontalAlignment = 'Center';

        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var fullSheetRange = worksheet.getRange('A1:L' + sheetLength);
        fullSheetRange.load('values');
        fullSheetRange.format.autofitColumns();

        var gCol = worksheet.getRange('H1:H' + sheetLength);
        gCol.format.columnWidth = 110;

        return ctx.sync()
          .then(function (res) {
            data.header = header;
            next(null, data);
          }).catch(function (err) {

            next({err: err, stage: 'setHeader', range: 'A1:L' + sheetLength, header: header});
          });
      });
    };

    var clearSheet = function (data, next) {
      Excel.run(function (ctx) {
        var ws = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var range = ws.getUsedRange();
        range.clear();

        return ctx.sync()
        .then(function (res) {
          next(null, data);
        }).catch(function (err) {
          next(null, data);
        })
      })
    }

    var createTable = function (data, next) {
      Excel.run(function (ctx) {
        var range = '\''+data.dataSheetName+'\'!A' + data.headerOffset + ':'+data.alphabetRangeValue+ (data.headerOffset + data.sheetData.length);
        var table = ctx.workbook.tables.add(range, true);
        table.load('name');

        return ctx.sync()
          .then(function (response) {
            data.tableName = table.name;
            data.tableId = table.id;
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }

    var addTableHeader = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var tables = ctx.workbook.tables;
        tables.getItem(data.tableName).getHeaderRowRange().values = [["Dept", "Company", "Project Manager", "Project", "Bus Unit", "Object", "Subsidary", "Budget", "Expendatures", "Remaining", "Encumbrances", "Unencumbered"]];

        return ctx.sync()
          .then(function (response) {
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }


    var addEmptyTableRows = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var messageData = [["No Data Found. Please change your selections amd try again", "", "", "", "", "", "", "", "", "", ""]];
        var messageRange = worksheet.getRange('A6:L6');
        messageRange.merge(true);
        messageRange.load('values');
        messageRange.values = messageData;

        return ctx.sync()
          .then(function (response) {
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    };

    var addTableRows = function (data, next) {
      var splitLen = 40;
      var chunk = data.sheetData.length;
      var split = [data.sheetData];
      var water = [];

      

      
      if (data.sheetData.length > 5000) {
        chunk = 200;
        split = _.chunk(data.sheetData, chunk);
      }

      var j = 0;

      for(var i = 0; i < split.length; i++) {
        water.push(function (cb) {
          Excel.run(function(ctx) {
            var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

            //TODO: Failing here
            // var sqlData = sheet.getRange("M1");
            // sqlData.load("values");
            // sqlData.values = JSON.stringify(split);
            //sqlData.values = 'A' + (chunk * (j - 1) + split[j-1].length + data.headerOffset + 1) + ':L' + (chunk*j + split[j].length + data.headerOffset);

            
            if (split.length > 1 && j === (split.length - 1)) {
              var range = 'A' + (chunk * (j - 1) + split[j-1].length + data.headerOffset + 1) + ':L' + (chunk*j + split[j].length + data.headerOffset);
              sheet.getRange(range).values = split[j];
            } 
            else {
              var rangeAddress = 'A' + (chunk*j + data.headerOffset + 1) + ':L' + (chunk*j + split[j].length + data.headerOffset);
              var range = sheet.getRange(rangeAddress);
              range.format.font.color = 'black';
              range.format.font.bold = false;
              range.values = split[j];
            }

            data.scope.$apply(function () {
              if ((j+1) * chunk > data.sheetData.length) {
                data.scope.modalData.message = 'Loading ' + data.sheetData.length + ' rows of ' + data.sheetData.length;
              } else {
                data.scope.modalData.message = 'Loading ' + (j+1)*chunk + ' rows of ' + data.sheetData.length;
              }
            });
            
            j++;

            return ctx.sync()
            .then(function (response) {
              cb(null);
            }).catch(function (err) {
              // var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
              // var sqlData = sheet.getRange("M1");
              // sqlData.load("values");
              // sqlData.values = JSON.stringify(err);
              cb(null);
            });
          });
        });
      }
      

      async.waterfall(water, function (err, res) {
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

    var addSubTotal = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        
        _.forEach(data.subTotalRows, function (val) {
          var numberRange = worksheet.getRange('E'+val+':L'+val);
          var range = worksheet.getRange('A'+val+':Z'+val);
          range.format.font.color = 'blue';
          range.format.font.bold = true;
          //numberRange.numberFormat = [_.fill(Array(7), formatPricingRed)];
        });

        return ctx.sync()
          .then(function (response) {
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }

    var addFilter = function (data, next) {
      Excel.run(function (ctx) {
        var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var table = sheet.tables.getItem(data.tableName);

        filter = table.columns.getItem("Project Manager").filter;
        filter.apply({
            filterOn: Excel.FilterOn.values,
            values: ["-"]
        });

        // sheet.getUsedRange().format.autofitColumns();
        // var len = data.sheetData.length + data.headerOffset;
        // var range = sheet.getRange('E' + data.headerOffset + ':L' + len);
        // range.format.columnWidth = 110;

        return ctx.sync()
          .then(function (response) {
            //data.tableName = table.name;
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }

    var addFormatting = function (data, next) {
      if (data.sheetData.length > 5000) {
        var len = data.sheetData.length + data.headerOffset;
        var formatArray = _.fill(Array(len),_.fill(Array(5), formatPricingRed));
        var chunk = 200;
        var split = _.chunk(formatArray, chunk);
        var water = [];
        var j = 0;

        for(var i = 0; i < split.length; i++) {
          water.push(function (cb) {
            Excel.run(function(ctx) {
              var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

              if (split.length > 1 && j === (split.length - 1)) {
                var range = 'H' + (chunk * (j - 1) + split[j-1].length + data.headerOffset + 1) + ':' + data.alphabetRangeValue + (chunk*j + split[j].length + data.headerOffset);
                sheet.getRange(range).numberFormat = split[j];
              } else {
                var rangeAddress = 'H' + (chunk*j + data.headerOffset + 1) + ':' + data.alphabetRangeValue + (chunk*j + split[j].length + data.headerOffset);
                var range = sheet.getRange(rangeAddress);

                range.numberFormat = split[j];
              }

              data.scope.$apply(function () {
                if ((j+1) * chunk > data.sheetData.length) {
                  data.scope.modalData.message = 'Formatting ' + data.sheetData.length + ' rows of ' + data.sheetData.length;
                } else {
                  data.scope.modalData.message = 'Formatting ' + (j+1)*chunk + ' rows of ' + data.sheetData.length;
                }
              });

              j++;

              return ctx.sync()
              .then(function (response) {
                cb(null);
              }).catch(function (err) {
                cb(null);
              });
            });
          });
        }
        async.waterfall(water, function (err, res) {
          next(null, data);
        });

      } else {
        Excel.run(function (ctx) {
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var len = data.sheetData.length + data.headerOffset;
          var numberRange = worksheet.getRange('H7:' + data.alphabetRangeValue + len)
          numberRange.numberFormat = _.fill(Array(data.sheetData.length),_.fill(Array(5), formatPricingRed));

          var len = data.sheetData.length + data.headerOffset;
          worksheet.getUsedRange().format.autofitColumns();
          //var sheetLength = data.sheetData.length + data.headerOffset - 1;
          var range = worksheet.getRange('E' + data.headerOffset + ':L' + len);
          range.format.columnWidth = 110;
          return ctx.sync()
            .then(function (response) {
              //data.tableName = table.name;
              next(null, data);  
            }).catch(function (err) {
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
    this.insertSpreadSheetData = function (data, cb) {
      // Callback with (err, result)
      try {
        async.waterfall([
          function (next) {
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
      } catch (e) {
        cb(e);
      }
    };

    var hideRows = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        
        var fullrange = worksheet.getRange('A1:Z1000');
        fullrange.rowHidden = false;

        _.forEach(data.hiddenRows, function (rowData) {
          var range = worksheet.getRange(rowData.range);
          range.rowHidden = true;
        });

        return ctx.sync()
          .then(function () {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'hideRows'});
          });
      });
    };

    var insertDataToWorkSheet = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var range = 'O';
        var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        if (data.sheetData.length > 0)
          var alphabetRangeValue = alphabet[data.sheetData[0].length-1];

        //var fullrange = worksheet.getRange();
        //fullrange.load('values');
        //fullrange.clear();
        _.forEach(data.hiddenRows, function (rowData) {
          var row = rowData.rows.substring(1, rowData.rows.length-1);
          var rowRange = worksheet.getRange("A"+row+":Z"+row);
          rowRange.format.font.bold = true;
        });

        var headerOffset = 7;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var range = worksheet.getRange('A' + headerOffset + ':' + alphabetRangeValue + sheetLength)
        range.load('values')
        range.values = data.sheetData
        range.format.autofitColumns();

        var numberRange = worksheet.getRange('H' + headerOffset + ':' + alphabetRangeValue + sheetLength)
        numberRange.numberFormat = _.fill(Array(data.sheetData.length),_.fill(Array(5), formatPricing));
        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'insertHttpDataIntoSpreadSheet', len: sheetLength });
          });
      });
    };

    var setSubTotalFormat = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

        _.forEach(data.subTotalRows, function (val) {
          var numberRange = worksheet.getRange('E'+val+':L'+val);
          var range = worksheet.getRange('A'+val+':Z'+val);
          range.format.font.color = 'blue';
          range.format.font.bold = true;
          numberRange.numberFormat = [_.fill(Array(7), formatPricingRed)];
        });

        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var range = worksheet.getRange('E' + headerOffset + ':L' + sheetLength)
        range.format.columnWidth = 110;

        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'setSubTotalColor'});
          });
      })
    };

    var addGrandTotal = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var headerOffset = 6;
        var length = headerOffset + data.sheetData.length;
        var grandTotalData = [['=SUM(H7:H' + (length) + ')/2', '=SUM(I7:I' + (length) + ')/2', '=SUM(J7:J' + (length) + ')/2', '=SUM(K7:K' + (length) + ')/2', '=SUM(L7:L' + (length) + ')/2']];

        var grandRange = worksheet.getRange('D' + (length+1));
        grandRange.load('values');
        grandRange.values = "Grand Total";
        grandRange.format.font.bold = true;
        grandRange.format.font.color = '#00037B';

        var range = worksheet.getRange('H' + (length+1) + ':L' + (length+1));
        range.load('values');
        range.values = grandTotalData;
        range.numberFormat = [_.fill(Array(5), formatPricingTotal)];
        range.format.font.bold = true;
        range.format.font.color = '#00037B';

        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'addGrandTotal', len: sheetLength });
          });
      });
    };
  }
]);
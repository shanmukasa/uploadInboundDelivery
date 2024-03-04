sap.ui.define([
    "sap/ui/core/mvc/Controller",
    '../model/formatter',
    'sap/ui/export/library',
	'sap/ui/export/Spreadsheet',
	'sap/m/MessageToast'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,formatter,library,Spreadsheet,MessageToast) {
        "use strict";

        return Controller.extend("com.tmca.zuploadinbounddelivery.controller.Worklist", {
            formatter: formatter,
            onInit: function () {
            },
            /*  Function to open the Message fragment
                Developer: shanmuka  */ 
            handleMessageDialog:function(oModel){
                var fragmentName = "com.tmca.zuploadinbounddelivery.view.MessageLog";
			if (!this.messageDialog) {
				this.messageDialog = this.loadFragment({
					name: fragmentName
				});
			}
			this.messageDialog.then(function (Dialog) {
				this.Dialog = Dialog;
                this.Dialog.setModel(oModel);
				this.Dialog.open();
			}.bind(this)); 
            },
           /*  Function to upload the file data and bind to the table
            Developer: shanmuka  */  
            _handleImport : function(e) {
                var t=this,
                 fU = this.getView().byId("idfileUploader"),
                 oFileUploader = fU,
                 file = oFileUploader.oFileUpload.files[0],
                 reader = new FileReader();
                 if(typeof file === 'undefined'){
                    return;
                 }
                reader.onload = function(e) {
                                 var strCSV = e.target.result;
                                strCSV = strCSV.replace("ï»¿","");
                                const dataArray = strCSV.split("\r\n");
                                var headers = dataArray[0].split(',');
                                headers = headers.map(item => item.replace(/[^a-zA-Z0-9./]/g, ''));
                                const objectsArray = [];
                                for (let i = 1; i < dataArray.length; i++) {
                                    const values = dataArray[i].split(',');
                                    const obj = {};
                                 
                                    for (let j = 0; j < headers.length; j++) {
                                        obj[headers[j]] = values[j] || "";
                                    }
                                    objectsArray.push(obj);
                                }
                                // Filter out empty objects
                                const filteredArray = objectsArray.filter(obj => Object.values(obj).some(value => value !== null && value !== ''));
	                         var oModel = new sap.ui.model.json.JSONModel();
	                         oModel.setData(filteredArray);
                             t.getView().setModel(oModel,"tableModel")
                             t.getView().byId("idTable").setModel(oModel,"tableModel");
                                };
              reader.readAsBinaryString(file);
            },
            createpayload:function(loaddata,tableData){
                loaddata.PONumber = tableData[0].PONumber;
                loaddata.DeliveryDate = tableData[0].DeliveryDate;
                loaddata.DeliveryNote = tableData[0].DeliveryNote;
                for(var i = 0; i< tableData.length;i++){
                loaddata.HeaderToUploadNav.push(tableData[i]);
                }
                return loaddata;
            },
         /* Function to call the backend for test Run and execute
            Developer: shanmuka  */  
            _handleTest_Execute:function(event){
                var oModel = this.getView().getModel(),// new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZMM_VEND_PORTAL_SRV/",true),
                  tableData = this.getView().getModel("tableModel").getData(),
                  that = this,
                  loaddata = {
                        "PONumber" : "",
                        "TestRun"  : "",
                        "DeliveryDate" : "",
                        "DeliveryNote" : "",
                        "HeaderToUploadNav" : [],
                        "HeaderToReturnNav" : []
                      };
                      if(tableData === null){
                        return;
                      }
                       if(event.getSource().getText() === "Test Run"){
                        loaddata.TestRun = true;
                       }else{
                        loaddata.TestRun = false;
                       }
                      this.createpayload(loaddata,tableData);
                      var nMS = 1000*60*60*24;
                      for(var i=0;i<loaddata.HeaderToUploadNav.length;i++){
                        if(typeof loaddata.HeaderToUploadNav[i].DeliveryDate === "object"){
                            loaddata.HeaderToUploadNav[i].DeliveryDate = loaddata.HeaderToUploadNav[i].DeliveryDate.toLocaleDateString();
                        }
                      var date = new Date(loaddata.HeaderToUploadNav[i].DeliveryDate);
                      loaddata.HeaderToUploadNav[i].DeliveryDate  = new Date(date.getTime() + nMS);
                      }
                      if(typeof loaddata.DeliveryDate === "object"){
                        loaddata.DeliveryDate = loaddata.DeliveryDate.toLocaleDateString();
                    }
                      var headerDate = new Date(loaddata.DeliveryDate);
                      loaddata.DeliveryDate = new Date(headerDate.getTime() + nMS);
                oModel.create("/ASN_Header_DataSet", loaddata, {
                    method: "POST",
                    success: function(data,response) {
                     var responsedata = response.data.HeaderToReturnNav.results;
                     let oJSonModel = new sap.ui.model.json.JSONModel();
                     oJSonModel.setData(responsedata);
                     that.updateTableData(response);
                     that.handleMessageDialog(oJSonModel);
                      },
                    error: function(e) {
                        alert("error");
                     }
                   });
            },
            updateTableData:function(response){
                var that = this;
                var HeaderToUploadNavData = response.data.HeaderToUploadNav.results;
                let tabelModelData = that.getView().byId("idTable").getModel("tableModel");
                     tabelModelData.setData(HeaderToUploadNavData);
                     that.getView().byId("idTable").setModel(tabelModelData,"tableModel");
                     that.getView().getModel("tableModel").refresh(true);
            },
             /* Function to create columns for export
            Developer: shanmuka  */  
            createColumnConfig: function() {
                return [
                    {
                        label: 'Item Number',
                        property: 'ItemNumber',
                        scale: 0
                    },
                    {
                        label: 'Message Id',
                        property: 'MsgId',
                        width: '25'
                    },
                    {
                        label: 'PO Number',
                        property: 'PONumber',
                        width: '25'
                    },
                    {
                        label: 'Message',
                        property: 'Msg',
                        width: '50'
                    },
                    {
                        label: 'DeliveryNumber',
                        property: 'DeliveryNumber',
                        width: '18'
                    }];
            },
            /* Function to export table data
            Developer: shanmuka  */  
            onExport: function() {
                var aCols, oBinding, oSettings, oSheet, oTable;
                oTable = this.byId('Table');
                oBinding = oTable.getBinding('items');
                aCols = this.createColumnConfig();
    
                oSettings = {
                    workbook: { columns: aCols },
                    dataSource: oBinding
                };
    
                oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function() {
                        MessageToast.show('Spreadsheet export has finished');
                        this.Dialog.close();
                    }).finally(function() {
                        oSheet.destroy();
                    });
            },
             /* Function to close the fragment
            Developer: shanmuka  */  
            handleClose:function(){
                this.Dialog.close();   
            }
        });
    });

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onInstall(){
   onOpen();
}

function onOpen(){
   initMenu();
}

// Δημιουργία επιλογών στο menu
function initMenu() {
  var ui = SpreadsheetApp.getUi();
  
  var menu = ui.createMenu("Sidebars");
  menu.addItem("Database Connection", "showDBConnectionSidebar");
  menu.addItem("Query Database", "showQueryBar");
  menu.addItem("Program Update", "showProgramBar");
  menu.addToUi();
}
 
 
//Sidebar για σύνδεση στη βάση δεδομένων
 function showDBConnectionSidebar(){
  var html = HtmlService.createTemplateFromFile('databaseBox').evaluate().setTitle("Database Connection").setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
 }


//Sidebar για εκτέλεση των queries
function showQueryBar(){
  var html = HtmlService.createTemplateFromFile('page').evaluate().setTitle("Query Database").setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

//Sidebar για προγραμματισμένα update
function showProgramBar(){
  var html = HtmlService.createTemplateFromFile('program').evaluate().setTitle("Program Update").setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);

 }

//Δημιουργία Metadata
function addMetadata(key,value){
      Logger.log(key,value)
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.addDeveloperMetadata(key,value);
}


function get(){
   
  var spreadsheet = SpreadsheetApp.openById('1i3XCnSU0p-kpy51lXIZU8kWkmOgvc_BtNvvKf_xDt2M');
  var mtaData = spreadsheet.getDeveloperMetadata();
  
  mtaData.forEach(                                 //Πέρνω τα στοιχεία της βάσης για να κάνω την σύνδεση
    function(thisMetaData) {
//if (thisMetaData.getKey() == 'server' || thisMetaData.getKey() == 'port'  || thisMetaData.getKey() == 'dbName' ||thisMetaData.getKey() == 'username' || thisMetaData.getKey() == 'password' || thisMetaData.getKey() == 'url' ){
Logger.log(thisMetaData.getKey()+'   '+thisMetaData.getValue())
// thisMetaData.remove();
  // }
    } 
  )  
}


function doPost(){
/*
//Logger = slog.useSpreadsheet('1n-NyP5MgCCu929ZmnReSbdNutZ_RmQ0GVQZkND2Aq98');

  //for (var prop in e.parameter) { Logger.log(prop+':'+e.parameter[prop]) };
 var sum  = 0;
 if (e.parameter.name){
   var name = e.parameter.name;
   var check  = e.parameter.check;
   if(check == 1){
     clearSheet();
     saveData(name,1);
     //lastQuery(name);
     return ContentService.createTextOutput( JSON.stringify({value:'saveData'}) ).setMimeType(ContentService.MimeType.JSON);
   }else{
     saveData(name,1);
     //lastQuery(name);
     return ContentService.createTextOutput( JSON.stringify({value:'saveDataUnchecked'}) ).setMimeType(ContentService.MimeType.JSON);
   }
  }if (e.parameter.update){
   var update = e.parameter.update;
  if(e.parameter.day && e.parameter.hour){
   var hour = e.parameter.hour;
   var day = e.parameter.day;
   query(update,hour,day);
  }else if(e.parameter.hour && !e.parameter.day){
   var hour = e.parameter.hour;
   query(update,hour,'noDay');
  }else if(!e.parameter.hour && !e.parameter.day){
    query(update,'noHour','noDay');
  }
  return ContentService.createTextOutput( JSON.stringify({value:'update'}) ).setMimeType(ContentService.MimeType.JSON);
  }if (e.parameter.dele){
   var dele = e.parameter.dele;
   deleteQuery(dele);
   return ContentService.createTextOutput( JSON.stringify({value:'deleteQuery'}) ).setMimeType(ContentService.MimeType.JSON);
  }if(e.parameter.deleAll){
    deleteQueries();
    return ContentService.createTextOutput( JSON.stringify({value:'deleteQueries'}) ).setMimeType(ContentService.MimeType.JSON);
  }if(e.parameter.server){
   sum++;
   var server = e.parameter.server;
  }if(e.parameter.port){
   sum++;
   var port = e.parameter.port;
  }if(e.parameter.dbName){
   sum++;
   var dbName = e.parameter.dbName;
  }if(e.parameter.username){
   sum++;
   var username = e.parameter.username;
  }if(e.parameter.password){
   sum++;
   var password = e.parameter.password;
  }
  if(sum == 5){
   var id = e.parameter.sheetId;
   parseDBInfo(server,port,dbName,username,password);
   Logger.log('OK doPostDB')
   return ContentService.createTextOutput( JSON.stringify({infoDB: dbName}) ).setMimeType(ContentService.MimeType.JSON);
  }*/
}



//Αποθήκευση των δεδομένων από το αποτέλεσμα του query
//Για program == 1 -> αποθήκευση στο active sheet
//Για program == 0 -> αποθήκευση στο sheet που είναι ορισμένο από το update
function saveData(query,program){
  var url = '';
  var username = '';
  var password = '';
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  if(program){
    var sheet = spreadsheet.getActiveSheet();
  }else{
    var er = spreadsheet.createDeveloperMetadataFinder()
           .withKey('sheet')
           .find()[0];
    var sheet = spreadsheet.getSheetByName(er.getValue());
    clearSheetbyName(er.getValue());
  }
  var mtaData = spreadsheet.getDeveloperMetadata();
  lastQuery(query);
  
  mtaData.forEach(                                 //Πέρνω τα στοιχεία της βάσης για να κάνω την σύνδεση
    function(thisMetaData) {
     if (thisMetaData.getKey() == 'url'){
       url = thisMetaData.getValue();
     }else if (thisMetaData.getKey() == 'username'){
       username = thisMetaData.getValue();
     }else if (thisMetaData.getKey() == 'password'){
       password = thisMetaData.getValue();
     }
    } 
  )
  
  var conn = Jdbc.getConnection(url, username, password);
  var stmt = conn.createStatement();
  var results = stmt.executeQuery(query);
  var metaData=results.getMetaData();
  var numCols = metaData.getColumnCount();
  
  var arr=[];
  
  Logger.log(mtaData.length)                         //Πόσα metadata υπάρχουν στο spreadsheet
  var key = 'key' + mtaData.length;
    
  var er = spreadsheet.createDeveloperMetadataFinder()
           .withValue(query)
           .find()[0];
  if (er == null){
     addMetadata(key,query);
     Logger.log('null')
  }
  var emptyRow = getFirstEmptyRow();
  
  if (emptyRow == 1){
    for (var col = 0; col < numCols; col++) {
      arr.push(metaData.getColumnName(col + 1));      //Εμφανίζω στο spreadsheet τους τίτλους της βάσης κάθε στήλης
    }
    sheet.appendRow(arr);
  }
  
  emptyRow = getFirstEmptyRow();
  
  var megaArr=[];
  while (results.next()) {
    arr=[];
    
    for (var col = 0; col < numCols; col++) {
      arr.push(results.getString(col + 1));
    }
     megaArr.push(arr);
  }
    
  spreadsheet.getActiveSheet().getRange(emptyRow,1,megaArr.length,numCols).setValues(megaArr);
  results.close();
  stmt.close();
  sheet.autoResizeColumns(1, numCols+1);
 }

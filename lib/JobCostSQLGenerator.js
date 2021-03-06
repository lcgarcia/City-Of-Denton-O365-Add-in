const _ = require('lodash');

var JobCostSQLGenerator = function(options) {
  this.schema = 'proddta'
  this.ctlSchema = 'prodctl';
  if (options && options.schema)
    this.schema = options.schema
  if (options && options.ctlSchema)
    this.ctlSchema = options.ctlSchema
  
  this.type = ''
  if (options && options.type)
    this.type = options.type
}

JobCostSQLGenerator.prototype.getUIData = function(reportSelected) {
  reportSelected = reportSelected || this.type;
  let queries = {
    years: `select DISTINCT case when gbctry = '20' then '200' ||` +
      `gbfy || ' - ' || '200' ||  TO_NUMBER(gbfy+1, '9G999D99') ELSE '19' || gbfy  ` +
      `|| ' - ' || TRIM(TO_CHAR(TO_NUMBER(gbctry*100)+TO_NUMBER(gbfy+1),9999)) END as name ` +
      `FROM ${this.schema}.F0902 ` +
      `WHERE gbfy <> 0 and gbctry <> 0`,
    projects: `SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name FROM ${this.schema}.F0006 ` +
      `WHERE mcstyl = 'PJ'  ` +
      `ORDER BY mcmcu`,
    jobs: `SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name FROM ${this.schema}.F0006 ` +
      `WHERE MCMCUS like '%XXX%' ` +
      `ORDER BY mcmcu`,
    company: this.getCompanySelections('*ALL', reportSelected),
  };
  if (reportSelected == 'ka' || reportSelected == 'new') {
    return _.merge(queries, {
      calendarYears: `select DISTINCT case when gbctry = '20' then '200' ||` +
        `gbfy  ELSE '19' || gbfy  ` +
        ` END as name ` +
        `FROM ${this.schema}.F0902 ` +
        `WHERE gbfy <> 0 and gbctry <> 0`,
      departments: `SELECT trim(drky) as key, trim(drky) || ' ' || drdl01 as name ` +
        `FROM ${this.ctlSchema}.F0005 ` +
        `WHERE drsy='00' and drrt='27' and drky <>' '`,
      catCodeHead: `SELECT dtrt as key, dtrt || ' ' || dtdl01 as name FROM ${this.ctlSchema}.F0004 ` +
        `WHERE dtsy = '00' and dtrt between '00' and '30' `,
    });
  }
  else if (reportSelected == 'e') {
    return _.merge(queries, {
      departments: `SELECT trim(drky) as key, trim(drky) || ' ' || drdl01 as name ` +
        `FROM ${this.ctlSchema}.F0005 ` +
        `WHERE drsy='00' and drrt='27' and drky <>' '`,
    });
  }
  else {
    return _.merge(queries, {
      departments: `SELECT trim(drky) as key, trim(drky) || ' ' || drdl01 as name ` +
        `FROM ${this.ctlSchema}.F0005 ` +
        `WHERE drsy='00' and drrt='27' and drky not in (' ','60') `,
    })
  }
};

// Add code code query
JobCostSQLGenerator.prototype.getCadeCodeDetail = function(department, company, project, status, job, catCode, reportSelected) {
  let departmentWhere, companyWhere, projectWhere, catCodeWhere, statusWhere;
  if (catCode.toLowerCase() === '*all')
    return "SELECT trim(drky) as key, trim(drky) || ' ' || drdl01 as name " +
      `FROM ${this.ctlSchema}.F0005 ` +
      "WHERE drsy = '00' and " +
      "drky not like '%*%'  ";
  
  if (department.toLowerCase() != '*all')
    departmentWhere = `a.MCRP27 = '${department}' `;
  else
    departmentWhere = "a.MCRP27 <> '*ALL' ";
  
  if (company.toLowerCase() != '*all')
    companyWhere = `a.MCCO = '${company}' `;
  else
    companyWhere = "a.MCCO <> '*ALL' ";
  
  if (project.toLowerCase() != '*all')
    projectWhere = `a.MCMCUS like '%${project}%' `;
  else
    projectWhere = "a.MCMCUS <> '*ALL' "
  
  catCodeSelect = `a.MCRP${catCode}`;
  
  if (job.toLowerCase() != '*all')
    jobWhere = `a.MCMCU like '%${job}' `;
  else
    jobWhere = "a.MCMCU <> '*ALL' ";
  
  if (status.toLowerCase() === 'closed')
    jobWhere += "and a.MCPECC = 'N'  ";
  else if (status.toLowerCase() === 'open')
    jobWhere += "and a.MCPECC in (' ','K') ";
  
  return `SELECT DISTINCT ${catCodeSelect} || '   ' || b.drdl01 as name, ${catCodeSelect} as key ` +
    `FROM ${this.schema}.F0006 a, (SELECT drky,drdl01 FROM ${this.ctlSchema}.F0005 WHERE drrt = '${catCode}' AND drsy = '00') b ` +
    `WHERE substr(trim(${catCodeSelect}),1,10)=substr(trim(b.drky),1,10) ` +
    `AND ${departmentWhere} AND ${companyWhere} AND ${projectWhere} AND ${jobWhere} ` +
    'ORDER BY 1';
};

JobCostSQLGenerator.prototype.getJobSelections = function(department, company, project, jobStatus, reportSelected) {
  reportSelected = reportSelected || this.type;
  if (reportSelected === '' || reportSelected === 'e')
    return this.getComplexJobselection(department, company, project, reportSelected);
  else
    return this.getBasicJobselection(department, company, project, jobStatus);
};

JobCostSQLGenerator.prototype.getBasicJobselection = function(department, company, project, jobStatus) {
  let sql = `SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name FROM ${this.schema}.F0006 `;
  const sort = "ORDER BY mcmcu";
  let departmentWhere, companyWhere, projectWhere, jobWhere;
  
  if (department.toUpperCase() != '*ALL') departmentWhere = `mcrp27 = '${department}' `;
  else departmentWhere = `mcrp27 <> '${department}' `;
  
  if (company.toUpperCase() != '*ALL') companyWhere = `mcco = '${company}' `;
  else companyWhere = `mcco <> '${company}' `;
  
  if (project.toUpperCase() != '*ALL') projectWhere = `mcmcus like '%${project}%' `;
  else projectWhere = `mcco <> '${project}' `;
  projectWhere += " AND substr(mcmcu,10,3) <> 'XXX' ";
  
  if (jobStatus.toUpperCase() === 'OPEN') jobWhere = `mcpecc in (' ','K') `;
  else if (jobStatus.toUpperCase() === 'CLOSED') jobWhere = `mcpecc in ('N') `;
  else jobWhere = `mcpecc <> '*ALL' `;
  
  return `${sql} WHERE ${departmentWhere} AND ${companyWhere} AND ${projectWhere} AND ${jobWhere} ${sort}`;
};

JobCostSQLGenerator.prototype.getComplexJobselection = function(department, company, project, reportSelected) {
  let sql = `SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name FROM ${this.schema}.F0006 `;
  const sort = "ORDER BY mcmcu";
  let where = ''
  department = department.toUpperCase();
  company = company.toUpperCase();
  project = project.toUpperCase();
  
  if (department === '*ALL' && company === '*ALL' && project === '*ALL') {
    if (reportSelected == '')
      where += `WHERE mcrp27 not in ('${department}', '60') AND mcco <> '${company}' AND mcmcus <> '${project}' `;
    else
      where += `WHERE mcrp27 <> '${department}' AND mcco <> '${company}' AND mcmcus <> '${project}' `;
  }
  else if (department === '*ALL' && company === '*ALL' && project != '*ALL') {
    if (reportSelected == '')
      where += `WHERE mcrp27<>'60' and mcmcus like '%${project}%' `;
    else
      where += `WHERE mcmcus like '%${project}%' `;
  }
  else if (department === '*ALL' && company != '*ALL' && project === '*ALL') {
    if (reportSelected == '')
      where += `WHERE mcrp27 not in ('${department}', '60') AND mcco = '${company}' AND mcmcus <> '${project}' `;
    else
      where += `WHERE mcrp27 <> '${department}' AND mcco = '${company}' AND mcmcus <> '${project}' `;
  }
  else if (department === '*ALL' && company != '*ALL' && project != '*ALL')
    where += `WHERE mcrp27 <> '${department}' AND mcco = '${company}' AND mcmcus = '${project}' `;
  else if (department != '*ALL' && company === '*ALL' && project === '*ALL')
    where += `WHERE mcrp27 = '${department}' AND mcco <> '${company}' AND mcmcus <> '${project}' `;
  else if (department != '*ALL' && company === '*ALL' && project != '*ALL')
    where += `WHERE mcrp27 = '${department}' AND mcco <> '${company}' AND mcmcus = '${project}' `;
  else if (department != '*ALL' && company != '*ALL' && project === '*ALL')
    where += `WHERE mcrp27 = '${department}' AND mcco = '${company}' `;
  else if (department != '*ALL' && company != '*ALL' && project != '*ALL')
    where += `WHERE mcrp27 = '${department}' AND mcco = '${company}' AND mcmcus like '%${project}%' `;
  where += "AND substr(mcmcu,10,3) <> 'XXX'";
  return sql + where + sort;
};

JobCostSQLGenerator.prototype.getProjectSelections = function(department, company, reportSelected) {
  reportSelected = reportSelected || this.type;
  
  const all = "SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name " +
    `FROM ${this.schema}.F0006 ` +
    "WHERE mcstyl = 'PJ'  " +
    (reportSelected === '' ? "and mcrp27 <> '60' " : "") +
    "ORDER BY mcmcu";
  const type1 = "SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name " +
    `FROM ${this.schema}.F0006 ` +
    "WHERE mcstyl = 'PJ'  " +
    (reportSelected === '' ? `AND mcrp27 not in ('${department}', '60') ` : `AND mcrp27 <> '${department}' `) +
    `AND mcco = '${company}' ` +
    "ORDER BY mcmcu";
  const type2 = "SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name " +
    `FROM ${this.schema}.F0006 ` +
    "WHERE mcstyl = 'PJ'  " +
    `AND mcrp27 = '${department}' ` +
    `AND mcco = '${company}' ` +
    "ORDER BY mcmcu";
  const type3 = "SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name " +
    `FROM ${this.schema}.F0006 ` +
    "WHERE mcstyl = 'PJ'  " +
    `AND mcrp27 = '${department}' ` +
    "ORDER BY mcmcu";
  
  if (department.toUpperCase() === '*ALL' && company.toUpperCase() != '*ALL')
    return type1;
  else if (department.toUpperCase() != '*ALL' && company.toUpperCase() === '*ALL')
    return type3;
  else if (department.toUpperCase() != '*ALL' && company.toUpperCase() != '*ALL')
    return type2;
  else
    return all;
};

JobCostSQLGenerator.prototype.getCompanySelections = function(department, reportSelected) {
  if (department === '*ALL') {
    return "SELECT ccco as key, ccco || ' ' || ccname as name " +
      `FROM ${this.schema}.F0010 ` +
      "WHERE (ccco between '00402' and '00404') OR " +
      "(ccco between '00408' and '00599') OR " +
      "(ccco between '00700' and '00799') OR " +
      "(ccco in ('00605','00632','00635','00642','00645','00665'," +
      "'00803','00805','00823','00825','00833','00835'," +
      "'00915','00916')) " +
      "ORDER BY ccco ";
  }
  else {
    return "SELECT distinct a.mcco || ' ' || b.ccname as name, a.mcco as key " +
      `FROM ${this.schema}.F0006 a,proddta.F0010 b ` +
      "WHERE a.mcco = b.ccco " +
      `AND a.mcrp27 = '${department}' ` +
      "ORDER BY key";
  }
};

/**
 * This function returns the SQL statement for sheet data
 * @param  {number} forMonth selected month
 * @param  {number} forYear  start year from range
 * @param  {object} options  should contain the following keys ('layout', 'department, 'company', 'job')
 *                           and optionally these ('status', 'catField', 'catField1', 'catCode', 'catCode1')
 * @return {string}          sql string
 */
JobCostSQLGenerator.prototype.createSelectStatement = function(forMonth, forYear, options) {
  const reportSelected = options.reportSelected || '';
  const select = this.select(reportSelected, forMonth, forYear, options.layout);
  const from = this.from();
  const where = this.where(reportSelected, forYear, options);
  const groupBy = this.groupBy(reportSelected, options.layout);
  const orderBy = this.orderBy(reportSelected, options.layout);
  
  return select + from + where + groupBy + orderBy;
};

/**
 * This function returns the SQL statement for sheet data for trend reports
 * @param  {number} forMonth selected month
 * @param  {number} forYear  start year from range
 * @param  {object} options  should contain the following keys ('layout', 'department, 'company', 'job')
 *                           and optionally these ('status', 'catField', 'catField1', 'catCode', 'catCode1')
 * @return {string}          sql string
 */
JobCostSQLGenerator.prototype.createTrendSelectStatement = function(monthStart, yearStart, yearEnd, options) {
  yearStart = (yearStart + "").substr(-2);
  yearEnd = (yearEnd + "").substr(-2);
  monthStart++;
  
  const reportSelected = options.reportSelected || '';
  const select = this.selectTrend(monthStart, yearStart, options.trend.periods);
  const from = this.from();
  const where = this.whereTrend(options);
  const groupBy = this.groupBy(reportSelected, options.layout);
  const orderBy = this.orderBy(reportSelected, options.layout);
  
  return select + from + where + groupBy + orderBy;
};

JobCostSQLGenerator.prototype.select = function(reportSelected, forMonth, forYear, layout) {
  reportSelected = reportSelected || this.type;
  if (forMonth.length > 4 && forMonth !== '13th')
    forMonth = forMonth.substr(0, 3);
  var toDateValues = this.ytdAndMTDValues(forMonth);
  var YTD = toDateValues.YTD;
  var MTD = toDateValues.MTD;
  if (forYear.length > 4)
    forYear = parseInt(String(forYear).substring(2, 4));
  
  var YTDPNL = `${YTD}-a.GBAPYC`
  var YTDBudget = `${YTD}+a.GBBORG`
  
  var columns = this.columnsForReport(reportSelected, layout);
  
  return `SELECT ${columns}` +
    `SUM(CASE WHEN a.GBLT = 'JA' THEN ${YTDBudget} ELSE 0 END)/100 as Budget, ` +
    `SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN ${YTD}  ELSE 0 END)/100 as Act, ` +
    `SUM(CASE WHEN a.GBLT = 'JA' THEN ${YTDBudget} ELSE 0 END)/100 - ` +
    `SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN ${YTD} ELSE 0 END)/100 as Remaining, ` +
    `SUM(CASE WHEN a.GBLT = 'PA' THEN ${YTD}  ELSE 0 END)/100 as Encumbrance, ` +
    `SUM(CASE WHEN a.GBLT = 'JA' THEN ${YTDBudget} ELSE 0 END)/100 - ` +
    `SUM(CASE WHEN a.GBOBJ between '1340' and '1370' and a.GBLT = 'AA' THEN ${YTD} ELSE 0 END)/100 - ` +
    `SUM(CASE WHEN a.GBLT = 'PA' THEN ${YTD} ELSE 0 END)/100 as Unencumbered `;
};

JobCostSQLGenerator.prototype.selectTrend = function(monthStart, yearStart, trendPeriods) {
  var month = monthStart;
  var fiscYear = yearStart;
  var selectTrend = "";
  
  //build the string of JDE columns to be selected
  for (let i = 1; i <= trendPeriods; i++) {
    //make sure fiscal year is always 2 digit
    if (fiscYear == 100) fiscYear = 0;
    
    //add a leading zero or not to the column
    if (month < 10)
      selectTrend += `SUM(CASE WHEN a.GBFY = ${fiscYear} THEN a.GBAN0${month} ELSE 0 END)/100,`;
    else
      selectTrend += `SUM(CASE WHEN a.GBFY = ${fiscYear} THEN a.GBAN${month} ELSE 0 END)/100,`;
    
    //check if we are crossing into another fiscal year
    if (month < 12) {
      month++;
    }
    else {
      month = 1;
      fiscYear++;
    }
  }
  selectTrend = selectTrend.substr(0, selectTrend.length - 1) + " ";
  return "SELECT b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,a.GBOBJ as Object,a.GBSUB as Sub," + selectTrend;
};

JobCostSQLGenerator.prototype.columnsForReport = function(reportSelected, layout) {
  if (reportSelected == 'ka' || reportSelected == 'new') {
    if (layout == 'No Details')
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,'' as  Object, '' as Sub, "
    else if (_.includes(['Cost Code/Type Details', 'FERC/Cost Code Subtotals', 'Cost Type Subtotals'], layout))
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,a.GBOBJ as Object,a.GBSUB as Sub, "
  }
  else if (reportSelected == 'e') {
    if (layout == 'No Details')
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,'' as  Object, '' as Sub, "
    else if (_.includes(['Cost Code/Type Details', 'FERC Details'], layout))
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,a.GBOBJ as Object,a.GBSUB as Sub, "
  }
  else {
    if (layout == 'No Details')
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,'' as  Object, '' as Sub, "
    else if (layout == 'Cost Code/Type Details')
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,a.GBOBJ as Object,a.GBSUB as Sub, "
  }
};

JobCostSQLGenerator.prototype.from = function() {
  return `FROM ${this.schema}.F0902 a,${this.schema}.F0006 b `
};

JobCostSQLGenerator.prototype.where = function(reportSelected, year, options) {
  const department = this.getDepartmentString(options.department);
  const company = this.getCompanyString(options.company);
  const project = this.getProjectString(options.project);
  let job = this.getJobString(options.job, options.status);
  
  year = `a.GBFY = ${String(year).substring(2,4)}`
  
  let whereStr = `WHERE a.gbmcu = b.mcmcu AND a.GBLT in ('AA','PA','JA') AND b.mcstyl = 'JB' AND ${department} AND ${company} AND ${project} AND ${job} AND ${year} `;
  
  if (reportSelected == 'ka' || reportSelected == 'new') {
    const catCodes = this.getCatCodeString(options.catField, options.catField1, options.catCode, options.catCode1);
    return `${whereStr} AND ${catCodes.cat} AND ${catCodes.cat1} `;
  }
  else return whereStr;
};

JobCostSQLGenerator.prototype.whereTrend = function(options) {
  const department = this.getDepartmentString(options.department);
  const company = this.getCompanyString(options.company);
  const project = this.getProjectString(options.project);
  const job = this.getJobString(options.job, options.status);
  const catCodes = this.getCatCodeString(options.catField, options.catField1, options.catCode, options.catCode1);
  var ledger = "'AA'";
  if (options.layout == "Trend - Budget") ledger = "'JA'";
  else if (options.layout == "Trend - Encumbrances") ledger = "'PA'";
  
  return `WHERE a.gbmcu = b.mcmcu AND a.GBLT = ${ledger} AND b.mcstyl = 'JB' AND ${department} AND ${company} AND ${project} AND ${job} AND ${catCodes.cat} AND ${catCodes.cat1} AND a.GBOBJ between '1340' and '1370' `;
};

JobCostSQLGenerator.prototype.getCatCodeString = function(catField, catField1, catCode, catCode1) {
  let cat;
  let cat1;
  let tmp;
  let tmp1;
  
  switch (catField.toUpperCase()) {
    case '*A':
    case '*ALL':
    case '--':
      cat = "b.MCRP01<>'*ALL' "
      break;
    default:
      tmp = `b.MCRP${catField}`
  };
  
  switch (catField1.toUpperCase()) {
    case '*A':
    case '*ALL':
    case '--':
      cat1 = "b.MCRP02<>'*ALL' "
      break;
    default:
      tmp1 = `b.MCRP${catField1}`
  };
  
  switch (catCode.toUpperCase()) {
    case '*AL':
    case '*ALL':
    case '--':
      cat = "b.MCRP01<>'*ALL'"
      break;
    default:
      cat = `${tmp} = '${catCode}'`
  };
  
  switch (catCode1.toUpperCase()) {
    case '*AL':
    case '*ALL':
    case '--':
      cat1 = "b.MCRP02<>'*ALL'"
      break;
    default:
      cat1 = `${tmp1} = '${catCode1}'`
  };
  
  return {
    cat,
    cat1
  };
};

JobCostSQLGenerator.prototype.getJobString = function(job, status) {
  let jobStr;
  if (job.toUpperCase() === '*ALL') jobStr = "a.GBMCU <> '*ALL' ";
  else jobStr = `a.GBMCU like '%${job.substring(0,9)}' `;
  
  if (status) {
    if (status.toUpperCase() === 'OPEN') return `${jobStr} and b.MCPECC in (' ','K') `
    else if (status.toUpperCase() === 'CLOSED') return `${jobStr} and b.MCPECC = 'N' `
    else return jobStr
  }
  else return jobStr
};

JobCostSQLGenerator.prototype.getProjectString = function(project) {
  if (project.toUpperCase() === '*ALL') return "b.MCMCUS <> '*ALL' "
  else return `b.MCMCUS like '%${project}%' `
};

JobCostSQLGenerator.prototype.getCompanyString = function(company) {
  if (company.toUpperCase() === '*ALL') return "a.GBCO <> '*ALL' "
  else return `a.GBCO = '${company}' `
};

JobCostSQLGenerator.prototype.getDepartmentString = function(department) {
  if (department.toUpperCase() === '*ALL') return "b.MCRP27 <> '*ALL' "
  else return `b.MCRP27 = '${department}' `
};

JobCostSQLGenerator.prototype.groupBy = function(reportSelected, layout) {
  if (reportSelected == 'e') {
    const expandedGroup = ['Cost Code/Type Details', 'FERC Details'];
    
    if (layout == 'No Details') return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 "
    else if (_.includes(expandedGroup, layout)) return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB "
    else return ''
  }
  else if (reportSelected == 'ka' || reportSelected == 'new') {
    const expandedGroup = ['Cost Code/Type Details', 'FERC/Cost Code Subtotals', 'Cost Type Subtotals', 'Trend - Expenditures', 'Trend - Budget', 'Trend - Encumbrances'];
    
    if (layout == 'No Details') return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 "
    else if (_.includes(expandedGroup, layout)) return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB "
    else return ''
  }
  else {
    if (layout == 'No Details') return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 "
    else if (layout == 'Cost Code/Type Details') return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB "
    else return ''
  }
};

JobCostSQLGenerator.prototype.orderBy = function(reportSelected, layout) {
  if (layout.includes("Trend")) return "ORDER BY 3,4,5,6 ";
  else if (reportSelected == 'e') {
    if (layout == 'FERC Details') return "ORDER BY 3,6,5 ";
    else return "ORDER BY 3,4,1,2 ";
  }
  else if (reportSelected == 'ka') {
    if (layout == 'FERC/Cost Code Subtotals') return "ORDER BY 3,6,5 ";
    else if (layout == 'Cost Type Subtotals') return "ORDER BY 3,5,6 ";
    else return "ORDER BY 3,4,1,2 ";
  }
  else {
    return 'ORDER BY 3,4,1,2 ';
  }
};

/**
 * Generate the YTD and MTD string values to be used in an query
 *
 * @param      {String}  forMonth  For month
 * @return     {Object}  Object containing a YTD and MTD SQL string
 */
JobCostSQLGenerator.prototype.ytdAndMTDValues = function(forMonth) {
  var YTD = '';
  var MTD = '';
  switch (forMonth.toLowerCase()) {
    case '13th':
      MTD = 'a.GBAN13'
      YTD = 'a.GBAN13'
      YTDBUD = `${YTD}+a.GBBORG`
    case 'sep':
      MTD = MTD == '' ? 'a.GBAN12' : MTD
      MTD = MTD == '' ? 'a.GBAN12' : MTD
      YTD = `a.GBAN12+${YTD}`
    case 'aug':
      MTD = MTD == '' ? 'a.GBAN11' : MTD
      YTD = `a.GBAN11+${YTD}`
    case 'jul':
    case 'july':
      MTD = MTD == '' ? 'a.GBAN10' : MTD
      YTD = `a.GBAN10+${YTD}`
    case 'jun':
    case'june':
      MTD = MTD == '' ? 'a.GBAN09' : MTD
      YTD = `a.GBAN09+${YTD}`
    case 'may':
      MTD = MTD == '' ? 'a.GBAN08' : MTD
      YTD = `a.GBAN08+${YTD}`
    case 'apr':
      MTD = MTD == '' ? 'a.GBAN07' : MTD
      YTD = `a.GBAN07+${YTD}`
    case 'mar':
      MTD = MTD == '' ? 'a.GBAN06' : MTD
      YTD = `a.GBAN06+${YTD}`
    case 'feb':
      MTD = MTD == '' ? 'a.GBAN05' : MTD
      YTD = `a.GBAN05+${YTD}`
    case 'jan':
      MTD = MTD == '' ? 'a.GBAN04' : MTD
      YTD = `a.GBAN04+${YTD}`
    case 'dec':
      MTD = MTD == '' ? 'a.GBAN03' : MTD
      YTD = `a.GBAN03+${YTD}`
    case 'nov':
      MTD = MTD == '' ? 'a.GBAN02' : MTD
      YTD = `a.GBAN02+${YTD}`
    case 'oct':
      MTD = MTD == '' ? 'a.GBAN01' : MTD
      YTD = `a.GBAPYC+a.GBAN01+${YTD}`
  }
  
  YTD = YTD[YTD.length - 1] == '+' ? YTD.substring(0, YTD.length - 1) : YTD
  return {
    YTD: YTD,
    MTD: MTD
  }
};

module.exports = JobCostSQLGenerator;
const fs = require('fs');
const path = require('path');

const ROOT = 'D:/PBI/SalesDashboard/SalesDashboard.Report/definition';
const PAGES_ROOT = path.join(ROOT, 'pages');
const VC_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json';
const PAGE_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json';

// Page ids
const PAGES = {
  exec: 'c82df86efe3445eedc45',
  product: 'cad445e0f0fa762a6c2c',
  store: '58c33ad37c66bb1bd8e5',
  compare: 'cb5b5a434d1142601374'
};

// Shared color palette (measure -> color, cross-visual consistency)
const C = {
  sales: '#118DFF',
  profit: '#1AAB40',
  purple: '#744EC2',
  gold: '#D9B300',
  teal: '#197278',
  orange: '#E66C37',
  py: '#9AA5B1',
  dark: '#2B2B2B',
  gray: '#6B6B6B',
  border: '#E1E4E8',
  bg: '#FFFFFF',
  navSel: '#118DFF'
};

// ---------- Field builders ----------
function colField(table, column, active) {
  const p = {
    field: { Column: { Expression: { SourceRef: { Entity: table } }, Property: column } },
    queryRef: `${table}.${column}`,
    nativeQueryRef: column
  };
  if (active !== undefined) p.active = active;
  return p;
}
function measField(table, name) {
  return {
    field: { Measure: { Expression: { SourceRef: { Entity: table } }, Property: name } },
    queryRef: `${table}.${name}`,
    nativeQueryRef: name
  };
}
function hierLevel(level, active) {
  return {
    field: {
      HierarchyLevel: {
        Expression: {
          Hierarchy: {
            Expression: {
              PropertyVariationSource: {
                Expression: { SourceRef: { Entity: 'DimDate' } },
                Name: 'Variation',
                Property: 'Date'
              }
            },
            Hierarchy: 'Date Hierarchy'
          }
        },
        Level: level
      }
    },
    queryRef: `DimDate.Date.Variation.Date Hierarchy.${level}`,
    nativeQueryRef: `Date ${level}`,
    active
  };
}
function sortByMeasure(name, direction) {
  return {
    sort: [{
      field: { Measure: { Expression: { SourceRef: { Entity: 'FactSales' } }, Property: name } },
      direction
    }],
    isDefaultSort: true
  };
}
function container(id, position, visual) {
  return {
    $schema: VC_SCHEMA,
    name: id,
    position: { x: position.x, y: position.y, z: position.z, height: position.h, width: position.w, tabOrder: position.t },
    visual
  };
}

// ---------- Shared builders ----------
function titleBox(text, rect) {
  return {
    visualType: 'textbox',
    objects: {
      general: [{
        properties: {
          paragraphs: [{
            textRuns: [{ value: text, textStyle: { fontFamily: 'Segoe UI Semibold', fontSize: '28px', color: '#2B2B2B' } }],
            horizontalTextAlignment: 'left'
          }]
        }
      }]
    },
    visualContainerObjects: {
      background: [{ properties: { show: { expr: { Literal: { Value: 'false' } } } } }],
      border: [{ properties: { show: { expr: { Literal: { Value: 'false' } } } } }],
      padding: [{ properties: { top: { expr: { Literal: { Value: '0D' } } }, bottom: { expr: { Literal: { Value: '0D' } } }, left: { expr: { Literal: { Value: '0D' } } }, right: { expr: { Literal: { Value: '0D' } } } } }]
    }
  };
}

function kpiCard(measure, label, color, opts) {
  opts = opts || {};
  const valueProps = {
    fontSize: { expr: { Literal: { Value: '34D' } } },
    bold: { expr: { Literal: { Value: 'true' } } }
  };
  if (opts.units) valueProps.labelDisplayUnits = { expr: { Literal: { Value: opts.units } } };
  if (opts.prec) valueProps.labelPrecision = { expr: { Literal: { Value: opts.prec } } };
  return {
    visualType: 'cardVisual',
    query: {
      queryState: {
        Data: { projections: [measField('FactSales', measure)] }
      }
    },
    objects: {
      value: [{ properties: valueProps, selector: { id: 'default' } }],
      label: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: `'${label}'` } } }, fontSize: { expr: { Literal: { Value: '12D' } } } }, selector: { id: 'default' } }],
      outline: [{ properties: { show: { expr: { Literal: { Value: 'false' } } } }, selector: { id: 'default' } }],
      accentBar: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, position: { expr: { Literal: { Value: "'Left'" } } }, width: { expr: { Literal: { Value: '5D' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${color}'` } } } } } }, selector: { id: 'default' } }],
      layout: [{ properties: { topOuterMargin: { expr: { Literal: { Value: '0L' } } }, bottomOuterMargin: { expr: { Literal: { Value: '0L' } } }, leftOuterMargin: { expr: { Literal: { Value: '0L' } } }, rightOuterMargin: { expr: { Literal: { Value: '0L' } } }, paddingUniform: { expr: { Literal: { Value: '0L' } } } }, selector: { id: 'default' } }],
      padding: [{ properties: { paddingIndividual: { expr: { Literal: { Value: 'true' } } }, topMargin: { expr: { Literal: { Value: '12L' } } }, bottomMargin: { expr: { Literal: { Value: '4L' } } }, leftMargin: { expr: { Literal: { Value: '20L' } } }, rightMargin: { expr: { Literal: { Value: '6L' } } } }, selector: { id: 'default' } }]
    },
    visualContainerObjects: {
      background: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.bg}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } }],
      border: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.border}'` } } } } }, radius: { expr: { Literal: { Value: '6D' } } } } }],
      padding: [{ properties: { top: { expr: { Literal: { Value: '0D' } } }, bottom: { expr: { Literal: { Value: '0D' } } }, left: { expr: { Literal: { Value: '0D' } } }, right: { expr: { Literal: { Value: '0D' } } } } }]
    }
  };
}

function dropdownSlicer(table, column, label) {
  return {
    visualType: 'slicer',
    query: { queryState: { Values: { projections: [colField(table, column)] } } },
    objects: {
      data: [{ properties: { mode: { expr: { Literal: { Value: "'Dropdown'" } } } } }],
      header: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: `'${label}'` } } } } }]
    },
    visualContainerObjects: {
      background: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.bg}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } }],
      border: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.border}'` } } } } }, radius: { expr: { Literal: { Value: '6D' } } } } }],
      padding: [{ properties: { top: { expr: { Literal: { Value: '8D' } } }, bottom: { expr: { Literal: { Value: '8D' } } }, left: { expr: { Literal: { Value: '8D' } } }, right: { expr: { Literal: { Value: '8D' } } } } }]
    }
  };
}

function navVisual() {
  return {
    visualType: 'pageNavigator',
    objects: {
      text: [
        { properties: { fontSize: { expr: { Literal: { Value: '13D' } } }, fontColor: { solid: { color: { expr: { Literal: { Value: "'#2B2B2B'" } } } } } } },
        { properties: { fontSize: { expr: { Literal: { Value: '13D' } } }, fontColor: { solid: { color: { expr: { Literal: { Value: "'#2B2B2B'" } } } } } }, selector: { id: 'default' } },
        { properties: { fontColor: { solid: { color: { expr: { Literal: { Value: "'#FFFFFF'" } } } } }, bold: { expr: { Literal: { Value: 'true' } } } }, selector: { id: 'selected' } }
      ],
      fill: [
        { properties: { show: { expr: { Literal: { Value: 'true' } } }, fillColor: { solid: { color: { expr: { Literal: { Value: "'#FFFFFF'" } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } },
        { properties: { show: { expr: { Literal: { Value: 'true' } } }, fillColor: { solid: { color: { expr: { Literal: { Value: "'#FFFFFF'" } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } }, selector: { id: 'default' } },
        { properties: { show: { expr: { Literal: { Value: 'true' } } }, fillColor: { solid: { color: { expr: { Literal: { Value: `'${C.navSel}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } }, selector: { id: 'selected' } },
        { properties: { show: { expr: { Literal: { Value: 'true' } } }, fillColor: { solid: { color: { expr: { Literal: { Value: "'#E8F1FD'" } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } }, selector: { id: 'hover' } }
      ]
    },
    visualContainerObjects: {
      background: [{ properties: { show: { expr: { Literal: { Value: 'false' } } } } }],
      border: [{ properties: { show: { expr: { Literal: { Value: 'false' } } } } }]
    }
  };
}

// Chart chrome: white card + 1px border + rounded
const CHART_CHROME = {
  background: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.bg}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } }],
  border: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.border}'` } } } } }, radius: { expr: { Literal: { Value: '6D' } } } } }],
  padding: [{ properties: { top: { expr: { Literal: { Value: '8D' } } }, bottom: { expr: { Literal: { Value: '8D' } } }, left: { expr: { Literal: { Value: '8D' } } }, right: { expr: { Literal: { Value: '8D' } } } } }]
};
function chartVCO(title) {
  return {
    title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: `'${title}'` } } }, fontSize: { expr: { Literal: { Value: '14D' } } } } }],
    ...CHART_CHROME
  };
}

// ---------- Page assembly ----------
function pageObject(pageId, displayName) {
  return {
    $schema: PAGE_SCHEMA,
    name: pageId,
    displayName,
    displayOption: 'FitToPage',
    height: 1080,
    width: 1920,
    objects: {
      background: [{
        properties: {
          color: { solid: { color: { expr: { Literal: { Value: "'#F2F3F5'" } } } } },
          transparency: { expr: { Literal: { Value: '0D' } } }
        }
      }]
    }
  };
}

function buildPage(pageId, displayName, visualDefs) {
  const visualObjs = visualDefs.map(d => container(d.id, d.position, d.visual));
  // Write page.json
  const pdir = path.join(PAGES_ROOT, pageId);
  fs.mkdirSync(path.join(pdir, 'visuals'), { recursive: true });
  fs.writeFileSync(path.join(pdir, 'page.json'), JSON.stringify(pageObject(pageId, displayName), null, 2));

  // Write visual.json files
  let counters = {};
  for (const d of visualDefs) {
    const vdir = path.join(pdir, 'visuals', d.id);
    fs.mkdirSync(vdir, { recursive: true });
    fs.writeFileSync(path.join(vdir, 'visual.json'), JSON.stringify(container(d.id, d.position, d.visual), null, 2));
    counters[d.id] = 'ok';
  }
  return { pageId, displayName, count: visualDefs.length };
}

// ============================================================
// Navigable header strip used on every page
// ============================================================
function header(title) {
  return [
    { id: 'aa000000000000000001', position: { x: 40, y: 16, z: 1, w: 560, h: 44, t: 1 }, visual: titleBox(title) },
    { id: 'ff000000000000000001', position: { x: 1120, y: 10, z: 1, w: 760, h: 52, t: 2 }, visual: navVisual() }
  ];
}

// ============================================================
// PAGE 1 — EXECUTIVE SUMMARY  (reuses working visuals from gen_report.js)
// ============================================================
const execVisuals = [
  ...header('Retail Executive Summary'),

  // KPI cards
  { id: 'aa000000000000000011', position: { x: 40, y: 64, z: 2, w: 290, h: 112, t: 3 }, visual: kpiCard('Total Sales', 'Total Sales', C.sales, { units: '1000000D', prec: '1L' }) },
  { id: 'aa000000000000000012', position: { x: 343, y: 64, z: 2, w: 290, h: 112, t: 4 }, visual: kpiCard('Gross Profit', 'Gross Profit', C.profit, { units: '1000000D', prec: '1L' }) },
  { id: 'aa000000000000000013', position: { x: 646, y: 64, z: 2, w: 290, h: 112, t: 5 }, visual: kpiCard('Total Orders', 'Total Orders', C.purple) },
  { id: 'aa000000000000000014', position: { x: 949, y: 64, z: 2, w: 290, h: 112, t: 6 }, visual: kpiCard('Active Customers', 'Active Customers', C.gold) },
  { id: 'aa000000000000000015', position: { x: 1252, y: 64, z: 2, w: 290, h: 112, t: 7 }, visual: kpiCard('Profit Margin %', 'Profit Margin', C.teal) },
  { id: 'aa000000000000000016', position: { x: 1555, y: 64, z: 2, w: 290, h: 112, t: 8 }, visual: kpiCard('Avg Order Value', 'Avg Order Value', C.orange, { units: '1000D', prec: '1L' }) },

  // Slicers
  { id: 'aa000000000000000020', position: { x: 40, y: 212, z: 3, w: 140, h: 80, t: 9 }, visual: dropdownSlicer('DimDate', 'Year', 'Year') },
  { id: 'aa000000000000000021', position: { x: 192, y: 212, z: 3, w: 170, h: 80, t: 10 }, visual: dropdownSlicer('DimStores', 'Country', 'Country') },
  { id: 'aa000000000000000022', position: { x: 374, y: 212, z: 3, w: 150, h: 80, t: 11 }, visual: dropdownSlicer('DimStores', 'Channel', 'Channel') },
  { id: 'aa000000000000000023', position: { x: 536, y: 212, z: 3, w: 190, h: 80, t: 12 }, visual: dropdownSlicer('DimProducts', 'Category', 'Category') },

  // Line — Sales & Profit Trend (drillable date)
  { id: 'aa000000000000000030', position: { x: 40, y: 320, z: 4, w: 900, h: 370, t: 13 }, visual: {
    visualType: 'lineChart',
    query: {
      queryState: {
        Category: { projections: [hierLevel('Year', true), hierLevel('Quarter', false), hierLevel('Month', false)] },
        Y: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Gross Profit')] }
      }
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      legend: [{ properties: { position: { expr: { Literal: { Value: "'TopCenter'" } } } } }],
      dataPoint: [
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.sales}'` } } } } }, transparency: { expr: { Literal: { Value: '20D' } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.profit}'` } } } } }, transparency: { expr: { Literal: { Value: '20D' } } } }, selector: { metadata: 'FactSales.Gross Profit' } }
      ],
      lineStyles: [
        { properties: { strokeWidth: { expr: { Literal: { Value: '3D' } } }, showMarker: { expr: { Literal: { Value: 'true' } } }, markerShape: { expr: { Literal: { Value: "'circle'" } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { strokeWidth: { expr: { Literal: { Value: '3D' } } }, lineStyle: { expr: { Literal: { Value: "'dashed'" } } }, showMarker: { expr: { Literal: { Value: 'true' } } }, markerShape: { expr: { Literal: { Value: "'square'" } } } }, selector: { metadata: 'FactSales.Gross Profit' } }
      ]
    },
    visualContainerObjects: chartVCO('Sales & Profit Trend')
  }},

  // Clustered column — Sales & Profit by Category
  { id: 'aa000000000000000031', position: { x: 960, y: 320, z: 4, w: 920, h: 370, t: 14 }, visual: {
    visualType: 'clusteredColumnChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimProducts', 'Category', true)] },
        Y: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Gross Profit')] }
      },
      sortDefinition: sortByMeasure('Total Sales', 'Descending')
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      legend: [{ properties: { position: { expr: { Literal: { Value: "'TopCenter'" } } } } }],
      dataPoint: [
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.sales}'` } } } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.profit}'` } } } } } }, selector: { metadata: 'FactSales.Gross Profit' } }
      ],
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '9D' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales & Profit by Category')
  }},

  // Bar — Sales by Country
  { id: 'aa000000000000000032', position: { x: 40, y: 720, z: 4, w: 580, h: 320, t: 15 }, visual: {
    visualType: 'barChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimStores', 'Country', true)] },
        Y: { projections: [measField('FactSales', 'Total Sales')] }
      },
      sortDefinition: sortByMeasure('Total Sales', 'Descending')
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      dataPoint: [{ properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.sales}'` } } } } } } }],
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '9D' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales by Country')
  }},

  // Donut — Sales by Channel
  { id: 'aa000000000000000033', position: { x: 640, y: 720, z: 4, w: 430, h: 320, t: 16 }, visual: {
    visualType: 'donutChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimStores', 'Channel', true)] },
        Y: { projections: [measField('FactSales', 'Total Sales')] }
      }
    },
    objects: {
      legend: [{ properties: { position: { expr: { Literal: { Value: "'Right'" } } } } }],
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales by Channel')
  }},

  // Pivot — Product Profitability
  { id: 'aa000000000000000034', position: { x: 1090, y: 720, z: 4, w: 790, h: 320, t: 17 }, visual: {
    visualType: 'pivotTable',
    query: {
      queryState: {
        Rows: { projections: [colField('DimProducts', 'Category'), colField('DimProducts', 'Subcategory')] },
        Values: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Gross Profit'), measField('FactSales', 'Profit Margin %')] }
      }
    },
    objects: {
      columnHeaders: [{ properties: { autoSizeColumnWidth: { expr: { Literal: { Value: 'true' } } }, columnAdjustment: { expr: { Literal: { Value: "'growToFit'" } } }, bold: { expr: { Literal: { Value: 'true' } } } } }],
      rowHeaders: [{ properties: { bold: { expr: { Literal: { Value: 'true' } } } } }]
    },
    visualContainerObjects: chartVCO('Product Profitability')
  }}
];

// ============================================================
// PAGE 2 — PRODUCT ANALYSIS
// ============================================================
const productVisuals = [
  ...header('Product Analysis'),

  // KPI cards
  { id: 'bb000000000000000011', position: { x: 40, y: 64, z: 2, w: 290, h: 112, t: 3 }, visual: kpiCard('Total Sales', 'Total Sales', C.sales, { units: '1000000D', prec: '1L' }) },
  { id: 'bb000000000000000012', position: { x: 343, y: 64, z: 2, w: 290, h: 112, t: 4 }, visual: kpiCard('Total Quantity', 'Total Quantity', C.purple, { units: '1000D', prec: '1L' }) },
  { id: 'bb000000000000000013', position: { x: 646, y: 64, z: 2, w: 290, h: 112, t: 5 }, visual: kpiCard('Gross Profit', 'Gross Profit', C.profit, { units: '1000000D', prec: '1L' }) },
  { id: 'bb000000000000000014', position: { x: 949, y: 64, z: 2, w: 290, h: 112, t: 6 }, visual: kpiCard('Profit Margin %', 'Profit Margin', C.teal) },

  // Slicers
  { id: 'bb000000000000000020', position: { x: 40, y: 212, z: 3, w: 230, h: 80, t: 7 }, visual: dropdownSlicer('DimProducts', 'Category', 'Category') },
  { id: 'bb000000000000000021', position: { x: 290, y: 212, z: 3, w: 300, h: 80, t: 8 }, visual: dropdownSlicer('DimProducts', 'Subcategory', 'Subcategory') },
  { id: 'bb000000000000000022', position: { x: 610, y: 212, z: 3, w: 210, h: 80, t: 9 }, visual: dropdownSlicer('DimProducts', 'Brand', 'Brand') },
  { id: 'bb000000000000000023', position: { x: 840, y: 212, z: 3, w: 210, h: 80, t: 10 }, visual: dropdownSlicer('DimProducts', 'Color', 'Color') },

  // Clustered column — Sales by Category & Subcategory (drill)
  { id: 'bb000000000000000030', position: { x: 40, y: 320, z: 4, w: 900, h: 370, t: 11 }, visual: {
    visualType: 'clusteredColumnChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimProducts', 'Category', true), colField('DimProducts', 'Subcategory', false)] },
        Y: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Gross Profit')] }
      },
      sortDefinition: sortByMeasure('Total Sales', 'Descending')
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      legend: [{ properties: { position: { expr: { Literal: { Value: "'TopCenter'" } } } } }],
      dataPoint: [
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.sales}'` } } } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.profit}'` } } } } } }, selector: { metadata: 'FactSales.Gross Profit' } }
      ],
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '9D' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales & Profit by Category')
  }},

  // Bar — Top Brands by Sales
  { id: 'bb000000000000000031', position: { x: 960, y: 320, z: 4, w: 440, h: 370, t: 12 }, visual: {
    visualType: 'barChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimProducts', 'Brand', true)] },
        Y: { projections: [measField('FactSales', 'Total Sales')] }
      },
      sortDefinition: sortByMeasure('Total Sales', 'Descending')
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      dataPoint: [{ properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.gold}'` } } } } } } }],
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '9D' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales by Brand')
  }},

  // Donut — Sales by Color
  { id: 'bb000000000000000032', position: { x: 1420, y: 320, z: 4, w: 460, h: 370, t: 13 }, visual: {
    visualType: 'donutChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimProducts', 'Color', true)] },
        Y: { projections: [measField('FactSales', 'Total Sales')] }
      }
    },
    objects: {
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales by Color')
  }},

  // Pivot — Product Profitability Detail
  { id: 'bb000000000000000033', position: { x: 40, y: 720, z: 4, w: 1240, h: 320, t: 14 }, visual: {
    visualType: 'pivotTable',
    query: {
      queryState: {
        Rows: { projections: [colField('DimProducts', 'Category'), colField('DimProducts', 'Subcategory'), colField('DimProducts', 'Product Name')] },
        Values: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Total Quantity'), measField('FactSales', 'Gross Profit'), measField('FactSales', 'Profit Margin %')] }
      }
    },
    objects: {
      columnHeaders: [{ properties: { autoSizeColumnWidth: { expr: { Literal: { Value: 'true' } } }, columnAdjustment: { expr: { Literal: { Value: "'growToFit'" } } }, bold: { expr: { Literal: { Value: 'true' } } } } }],
      rowHeaders: [{ properties: { bold: { expr: { Literal: { Value: 'true' } } } } }]
    },
    visualContainerObjects: chartVCO('Product Profitability Detail')
  }},

  // Line — Monthly Sales Trend
  { id: 'bb000000000000000034', position: { x: 1300, y: 720, z: 4, w: 580, h: 320, t: 15 }, visual: {
    visualType: 'lineChart',
    query: {
      queryState: {
        Category: { projections: [hierLevel('Year', true), hierLevel('Month', false)] },
        Y: { projections: [measField('FactSales', 'Total Sales')] }
      }
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      dataPoint: [{ properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.purple}'` } } } } } } }],
      lineStyles: [{ properties: { strokeWidth: { expr: { Literal: { Value: '3D' } } }, showMarker: { expr: { Literal: { Value: 'true' } } }, markerShape: { expr: { Literal: { Value: "'circle'" } } } } }]
    },
    visualContainerObjects: chartVCO('Sales Trend')
  }}
];

// ============================================================
// PAGE 3 — STORE ANALYSIS
// ============================================================
const storeVisuals = [
  ...header('Store Analysis'),

  // KPI cards
  { id: 'cc000000000000000011', position: { x: 40, y: 64, z: 2, w: 290, h: 112, t: 3 }, visual: kpiCard('Total Sales', 'Total Sales', C.sales, { units: '1000000D', prec: '1L' }) },
  { id: 'cc000000000000000012', position: { x: 343, y: 64, z: 2, w: 290, h: 112, t: 4 }, visual: kpiCard('Total Orders', 'Total Orders', C.purple) },
  { id: 'cc000000000000000013', position: { x: 646, y: 64, z: 2, w: 290, h: 112, t: 5 }, visual: kpiCard('Active Customers', 'Active Customers', C.gold) },
  { id: 'cc000000000000000014', position: { x: 949, y: 64, z: 2, w: 290, h: 112, t: 6 }, visual: kpiCard('Gross Profit', 'Gross Profit', C.profit, { units: '1000000D', prec: '1L' }) },

  // Slicers
  { id: 'cc000000000000000020', position: { x: 40, y: 212, z: 3, w: 170, h: 80, t: 7 }, visual: dropdownSlicer('DimStores', 'Country', 'Country') },
  { id: 'cc000000000000000021', position: { x: 230, y: 212, z: 3, w: 200, h: 80, t: 8 }, visual: dropdownSlicer('DimStores', 'State', 'State') },
  { id: 'cc000000000000000022', position: { x: 450, y: 212, z: 3, w: 150, h: 80, t: 9 }, visual: dropdownSlicer('DimStores', 'Channel', 'Channel') },
  { id: 'cc000000000000000023', position: { x: 620, y: 212, z: 3, w: 200, h: 80, t: 10 }, visual: dropdownSlicer('DimStores', 'Store Size Band', 'Store Size') },

  // Clustered column — Sales by Country & State (drill)
  { id: 'cc000000000000000030', position: { x: 40, y: 320, z: 4, w: 900, h: 370, t: 11 }, visual: {
    visualType: 'clusteredColumnChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimStores', 'Country', true), colField('DimStores', 'State', false)] },
        Y: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Gross Profit')] }
      },
      sortDefinition: sortByMeasure('Total Sales', 'Descending')
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      legend: [{ properties: { position: { expr: { Literal: { Value: "'TopCenter'" } } } } }],
      dataPoint: [
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.sales}'` } } } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.profit}'` } } } } } }, selector: { metadata: 'FactSales.Gross Profit' } }
      ],
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '9D' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales & Profit by Country')
  }},

  // Bar — Sales by Channel
  { id: 'cc000000000000000031', position: { x: 960, y: 320, z: 4, w: 440, h: 370, t: 12 }, visual: {
    visualType: 'barChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimStores', 'Channel', true)] },
        Y: { projections: [measField('FactSales', 'Total Sales')] }
      },
      sortDefinition: sortByMeasure('Total Sales', 'Descending')
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      dataPoint: [{ properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.teal}'` } } } } } } }],
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '9D' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales by Channel')
  }},

  // Donut — Sales by Store Size Band
  { id: 'cc000000000000000032', position: { x: 1420, y: 320, z: 4, w: 460, h: 370, t: 13 }, visual: {
    visualType: 'donutChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimStores', 'Store Size Band', true)] },
        Y: { projections: [measField('FactSales', 'Total Sales')] }
      }
    },
    objects: {
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales by Store Size')
  }},

  // Pivot — Store Performance
  { id: 'cc000000000000000033', position: { x: 40, y: 720, z: 4, w: 1000, h: 320, t: 14 }, visual: {
    visualType: 'pivotTable',
    query: {
      queryState: {
        Rows: { projections: [colField('DimStores', 'Country'), colField('DimStores', 'State'), colField('DimStores', 'Store Name')] },
        Values: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Total Quantity'), measField('FactSales', 'Gross Profit'), measField('FactSales', 'Profit Margin %')] }
      }
    },
    objects: {
      columnHeaders: [{ properties: { autoSizeColumnWidth: { expr: { Literal: { Value: 'true' } } }, columnAdjustment: { expr: { Literal: { Value: "'growToFit'" } } }, bold: { expr: { Literal: { Value: 'true' } } } } }],
      rowHeaders: [{ properties: { bold: { expr: { Literal: { Value: 'true' } } } } }]
    },
    visualContainerObjects: chartVCO('Store Performance')
  }},

  // Line — Sales Trend
  { id: 'cc000000000000000034', position: { x: 1060, y: 720, z: 4, w: 820, h: 320, t: 15 }, visual: {
    visualType: 'lineChart',
    query: {
      queryState: {
        Category: { projections: [hierLevel('Year', true), hierLevel('Quarter', false), hierLevel('Month', false)] },
        Y: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Total Orders')] }
      }
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      legend: [{ properties: { position: { expr: { Literal: { Value: "'TopCenter'" } } } } }],
      dataPoint: [
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.purple}'` } } } } }, transparency: { expr: { Literal: { Value: '20D' } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.orange}'` } } } } }, transparency: { expr: { Literal: { Value: '20D' } } } }, selector: { metadata: 'FactSales.Total Orders' } }
      ],
      lineStyles: [
        { properties: { strokeWidth: { expr: { Literal: { Value: '3D' } } }, showMarker: { expr: { Literal: { Value: 'true' } } }, markerShape: { expr: { Literal: { Value: "'circle'" } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { strokeWidth: { expr: { Literal: { Value: '3D' } } }, lineStyle: { expr: { Literal: { Value: "'dashed'" } } }, showMarker: { expr: { Literal: { Value: 'true' } } }, markerShape: { expr: { Literal: { Value: "'square'" } } } }, selector: { metadata: 'FactSales.Total Orders' } }
      ]
    },
    visualContainerObjects: chartVCO('Sales & Orders Trend')
  }}
];

// ============================================================
// PAGE 4 — TOTAL SALES COMPARISON
// ============================================================
const compareVisuals = [
  ...header('Total Sales Comparison'),

  // KPI cards
  { id: 'dd000000000000000011', position: { x: 40, y: 64, z: 2, w: 290, h: 112, t: 3 }, visual: kpiCard('Total Sales', 'Total Sales', C.sales, { units: '1000000D', prec: '1L' }) },
  { id: 'dd000000000000000012', position: { x: 343, y: 64, z: 2, w: 290, h: 112, t: 4 }, visual: kpiCard('Sales PY', 'Sales Previous Year', C.py, { units: '1000000D', prec: '1L' }) },
  { id: 'dd000000000000000013', position: { x: 646, y: 64, z: 2, w: 290, h: 112, t: 5 }, visual: kpiCard('Sales YoY', 'Sales YoY', C.orange, { units: '1000000D', prec: '1L' }) },
  { id: 'dd000000000000000014', position: { x: 949, y: 64, z: 2, w: 290, h: 112, t: 6 }, visual: kpiCard('Sales YoY %', 'Sales YoY %', C.teal) },
  { id: 'dd000000000000000015', position: { x: 1252, y: 64, z: 2, w: 290, h: 112, t: 7 }, visual: kpiCard('Sales YTD', 'Sales YTD', C.gold, { units: '1000000D', prec: '1L' }) },
  { id: 'dd000000000000000016', position: { x: 1555, y: 64, z: 2, w: 290, h: 112, t: 8 }, visual: kpiCard('Gross Profit YTD', 'Gross Profit YTD', C.profit, { units: '1000000D', prec: '1L' }) },

  // Slicers
  { id: 'dd000000000000000020', position: { x: 40, y: 212, z: 3, w: 140, h: 80, t: 9 }, visual: dropdownSlicer('DimDate', 'Year', 'Year') },
  { id: 'dd000000000000000021', position: { x: 192, y: 212, z: 3, w: 160, h: 80, t: 10 }, visual: dropdownSlicer('DimDate', 'Quarter', 'Quarter') },
  { id: 'dd000000000000000022', position: { x: 364, y: 212, z: 3, w: 150, h: 80, t: 11 }, visual: dropdownSlicer('DimStores', 'Channel', 'Channel') },
  { id: 'dd000000000000000023', position: { x: 526, y: 212, z: 3, w: 190, h: 80, t: 12 }, visual: dropdownSlicer('DimProducts', 'Category', 'Category') },

  // Clustered column — Sales vs Previous Year
  { id: 'dd000000000000000030', position: { x: 40, y: 320, z: 4, w: 900, h: 370, t: 13 }, visual: {
    visualType: 'clusteredColumnChart',
    query: {
      queryState: {
        Category: { projections: [hierLevel('Year', true), hierLevel('Quarter', false)] },
        Y: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Sales PY')] }
      }
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      legend: [{ properties: { position: { expr: { Literal: { Value: "'TopCenter'" } } } } }],
      dataPoint: [
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.sales}'` } } } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.py}'` } } } } } }, selector: { metadata: 'FactSales.Sales PY' } }
      ],
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '9D' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales vs Previous Year')
  }},

  // Line — Sales YoY % by Year
  { id: 'dd000000000000000031', position: { x: 960, y: 320, z: 4, w: 440, h: 370, t: 14 }, visual: {
    visualType: 'lineChart',
    query: {
      queryState: {
        Category: { projections: [hierLevel('Year', true)] },
        Y: { projections: [measField('FactSales', 'Sales YoY %')] }
      }
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { labelDisplayUnits: { expr: { Literal: { Value: 'none' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      dataPoint: [{ properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.teal}'` } } } } } } }],
      lineStyles: [{ properties: { strokeWidth: { expr: { Literal: { Value: '3D' } } }, showMarker: { expr: { Literal: { Value: 'true' } } }, markerShape: { expr: { Literal: { Value: "'circle'" } } } } }]
    },
    visualContainerObjects: chartVCO('YoY Growth %')
  }},

  // Donut — Sales by Channel
  { id: 'dd000000000000000032', position: { x: 1420, y: 320, z: 4, w: 460, h: 370, t: 15 }, visual: {
    visualType: 'donutChart',
    query: {
      queryState: {
        Category: { projections: [colField('DimStores', 'Channel', true)] },
        Y: { projections: [measField('FactSales', 'Total Sales')] }
      }
    },
    objects: {
      labels: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } } } }]
    },
    visualContainerObjects: chartVCO('Sales by Channel')
  }},

  // Line — Monthly Sales Trend
  { id: 'dd000000000000000033', position: { x: 40, y: 720, z: 4, w: 900, h: 320, t: 16 }, visual: {
    visualType: 'lineChart',
    query: {
      queryState: {
        Category: { projections: [hierLevel('Year', true), hierLevel('Month', false)] },
        Y: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Gross Profit')] }
      }
    },
    objects: {
      categoryAxis: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }],
      valueAxis: [{ properties: { start: { expr: { Literal: { Value: '0D' } } }, labelDisplayUnits: { expr: { Literal: { Value: '1000000D' } } }, labelPrecision: { expr: { Literal: { Value: '1L' } } }, gridlineStyle: { expr: { Literal: { Value: "'solid'" } } } } }],
      legend: [{ properties: { position: { expr: { Literal: { Value: "'TopCenter'" } } } } }],
      dataPoint: [
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.sales}'` } } } } }, transparency: { expr: { Literal: { Value: '20D' } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { fill: { solid: { color: { expr: { Literal: { Value: `'${C.profit}'` } } } } }, transparency: { expr: { Literal: { Value: '20D' } } } }, selector: { metadata: 'FactSales.Gross Profit' } }
      ],
      lineStyles: [
        { properties: { strokeWidth: { expr: { Literal: { Value: '3D' } } }, showMarker: { expr: { Literal: { Value: 'true' } } }, markerShape: { expr: { Literal: { Value: "'circle'" } } } }, selector: { metadata: 'FactSales.Total Sales' } },
        { properties: { strokeWidth: { expr: { Literal: { Value: '3D' } } }, lineStyle: { expr: { Literal: { Value: "'dashed'" } } }, showMarker: { expr: { Literal: { Value: 'true' } } }, markerShape: { expr: { Literal: { Value: "'square'" } } } }, selector: { metadata: 'FactSales.Gross Profit' } }
      ]
    },
    visualContainerObjects: chartVCO('Sales & Profit Trend')
  }},

  // Pivot — Yearly Sales Comparison
  { id: 'dd000000000000000034', position: { x: 960, y: 720, z: 4, w: 920, h: 320, t: 17 }, visual: {
    visualType: 'pivotTable',
    query: {
      queryState: {
        Rows: { projections: [colField('DimDate', 'Year')] },
        Values: { projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Sales PY'), measField('FactSales', 'Sales YoY'), measField('FactSales', 'Sales YoY %'), measField('FactSales', 'Sales YTD')] }
      }
    },
    objects: {
      columnHeaders: [{ properties: { autoSizeColumnWidth: { expr: { Literal: { Value: 'true' } } }, columnAdjustment: { expr: { Literal: { Value: "'growToFit'" } } }, bold: { expr: { Literal: { Value: 'true' } } } } }],
      rowHeaders: [{ properties: { bold: { expr: { Literal: { Value: 'true' } } } } }]
    },
    visualContainerObjects: chartVCO('Yearly Sales Comparison')
  }}
];

// ============================================================
// Build everything
// ============================================================
const results = [
  buildPage(PAGES.exec, 'Executive Summary', execVisuals),
  buildPage(PAGES.product, 'Product Analysis', productVisuals),
  buildPage(PAGES.store, 'Store Analysis', storeVisuals),
  buildPage(PAGES.compare, 'Total Sales Comparison', compareVisuals)
];

// Update pages.json
const pagesJsonPath = path.join(PAGES_ROOT, 'pages.json');
const pageOrder = results.map(r => r.pageId);
fs.writeFileSync(pagesJsonPath, JSON.stringify({
  $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.1.0/schema.json',
  pageOrder,
  activePageName: PAGES.exec
}, null, 2));

console.log(JSON.stringify(results, null, 2));
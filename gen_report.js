const fs = require('fs');
const path = require('path');

const PAGE_DIR = 'D:/PBI/SalesDashboard/SalesDashboard.Report/definition/pages/c82df86efe3445eedc45';
const VIS_DIR = path.join(PAGE_DIR, 'visuals');
const SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json';

// Shared color palette (measure -> color, cross-visual consistency)
const C = {
  sales: '#118DFF',
  profit: '#1AAB40',
  purple: '#744EC2',
  gold: '#D9B300',
  teal: '#197278',
  orange: '#E66C37',
  dark: '#2B2B2B',
  gray: '#6B6B6B',
  border: '#E1E4E8',
  bg: '#FFFFFF'
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
// Date hierarchy projection for DimDate.Date (variation "Variation", hierarchy "Date Hierarchy")
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
    $schema: SCHEMA,
    name: id,
    position: { x: position.x, y: position.y, z: position.z, height: position.h, width: position.w, tabOrder: position.t },
    visual
  };
}

const visuals = [];
function add(id, position, visual) {
  visuals.push({ id, position, visual });
}

// ============================================================
// 1. Title textbox
// ============================================================
add('aa000000000000000001', { x: 40, y: 16, z: 1, w: 900, h: 44, t: 1 }, {
  visualType: 'textbox',
  objects: {
    general: [{
      properties: {
        paragraphs: [{
          textRuns: [{ value: 'Retail Sales Executive Report', textStyle: { fontFamily: 'Segoe UI Semibold', fontSize: '28px', color: '#2B2B2B' } }],
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
});

// ============================================================
// 2-7. KPI cards (single-value cardVisual with left accent bar)
// ============================================================
const kpis = [
  { measure: 'Total Sales', label: 'Total Sales', color: C.sales, units: '1000000D', prec: '1L' },
  { measure: 'Gross Profit', label: 'Gross Profit', color: C.profit, units: '1000000D', prec: '1L' },
  { measure: 'Total Orders', label: 'Total Orders', color: C.purple },
  { measure: 'Active Customers', label: 'Active Customers', color: C.gold },
  { measure: 'Profit Margin %', label: 'Profit Margin', color: C.teal },
  { measure: 'Avg Order Value', label: 'Avg Order Value', color: C.orange }
];
const kpiX = [40, 343, 646, 949, 1252, 1555];
kpis.forEach((k, i) => {
  const valueProps = {
    fontSize: { expr: { Literal: { Value: '34D' } } },
    bold: { expr: { Literal: { Value: 'true' } } }
  };
  if (k.units) {
    valueProps.labelDisplayUnits = { expr: { Literal: { Value: k.units } } };
    valueProps.labelPrecision = { expr: { Literal: { Value: k.prec } } };
  }
  add(`aa00000000000000001${i + 1}`, { x: kpiX[i], y: 64, z: 2, w: 290, h: 112, t: 2 + i }, {
    visualType: 'cardVisual',
    query: {
      queryState: {
        Data: { projections: [measField('FactSales', k.measure)] }
      }
    },
    objects: {
      value: [{ properties: valueProps, selector: { id: 'default' } }],
      label: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: `'${k.label}'` } } }, fontSize: { expr: { Literal: { Value: '12D' } } } }, selector: { id: 'default' } }],
      outline: [{ properties: { show: { expr: { Literal: { Value: 'false' } } } }, selector: { id: 'default' } }],
      accentBar: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, position: { expr: { Literal: { Value: "'Left'" } } }, width: { expr: { Literal: { Value: '5D' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${k.color}'` } } } } } }, selector: { id: 'default' } }],
      layout: [{ properties: { topOuterMargin: { expr: { Literal: { Value: '0L' } } }, bottomOuterMargin: { expr: { Literal: { Value: '0L' } } }, leftOuterMargin: { expr: { Literal: { Value: '0L' } } }, rightOuterMargin: { expr: { Literal: { Value: '0L' } } }, paddingUniform: { expr: { Literal: { Value: '0L' } } } }, selector: { id: 'default' } }],
      padding: [{ properties: { paddingIndividual: { expr: { Literal: { Value: 'true' } } }, topMargin: { expr: { Literal: { Value: '12L' } } }, bottomMargin: { expr: { Literal: { Value: '4L' } } }, leftMargin: { expr: { Literal: { Value: '20L' } } }, rightMargin: { expr: { Literal: { Value: '6L' } } } }, selector: { id: 'default' } }]
    },
    visualContainerObjects: {
      background: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.bg}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } }],
      border: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.border}'` } } } } }, radius: { expr: { Literal: { Value: '6D' } } } } }],
      padding: [{ properties: { top: { expr: { Literal: { Value: '0D' } } }, bottom: { expr: { Literal: { Value: '0D' } } }, left: { expr: { Literal: { Value: '0D' } } }, right: { expr: { Literal: { Value: '0D' } } } } }]
    }
  });
});

// ============================================================
// 8-11. Slicers (dropdown)  — Year, Country, Channel, Category
// ============================================================
function dropdownSlicer(table, column, label, rect) {
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
add('aa000000000000000020', { x: 40, y: 212, z: 3, w: 140, h: 80, t: 8 }, dropdownSlicer('DimDate', 'Year', 'Year', {}));
add('aa000000000000000021', { x: 192, y: 212, z: 3, w: 170, h: 80, t: 9 }, dropdownSlicer('DimStores', 'Country', 'Country', {}));
add('aa000000000000000022', { x: 374, y: 212, z: 3, w: 150, h: 80, t: 10 }, dropdownSlicer('DimStores', 'Channel', 'Channel', {}));
add('aa000000000000000023', { x: 536, y: 212, z: 3, w: 190, h: 80, t: 11 }, dropdownSlicer('DimProducts', 'Category', 'Category', {}));

// ============================================================
// 12. Line chart — Sales & Profit by Year (date hierarchy, drillable)
// ============================================================
add('aa000000000000000030', { x: 40, y: 320, z: 4, w: 900, h: 370, t: 12 }, {
  visualType: 'lineChart',
  query: {
    queryState: {
      Category: {
        projections: [hierLevel('Year', true), hierLevel('Quarter', false), hierLevel('Month', false)]
      },
      Y: {
        projections: [measField('FactSales', 'Total Sales'), measField('FactSales', 'Gross Profit')]
      }
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
  visualContainerObjects: {
    title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: "'Sales & Profit Trend'" } } }, fontSize: { expr: { Literal: { Value: '14D' } } } } }],
    background: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.bg}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } }],
    border: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.border}'` } } } } }, radius: { expr: { Literal: { Value: '6D' } } } } }],
    padding: [{ properties: { top: { expr: { Literal: { Value: '8D' } } }, bottom: { expr: { Literal: { Value: '8D' } } }, left: { expr: { Literal: { Value: '8D' } } }, right: { expr: { Literal: { Value: '8D' } } } } }]
  }
});

// ============================================================
// 13. Clustered column — Sales & Profit by Category
// ============================================================
add('aa000000000000000031', { x: 960, y: 320, z: 4, w: 920, h: 370, t: 13 }, {
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
  visualContainerObjects: {
    title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: "'Sales & Profit by Category'" } } }, fontSize: { expr: { Literal: { Value: '14D' } } } } }],
    background: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.bg}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } }],
    border: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.border}'` } } } } }, radius: { expr: { Literal: { Value: '6D' } } } } }],
    padding: [{ properties: { top: { expr: { Literal: { Value: '8D' } } }, bottom: { expr: { Literal: { Value: '8D' } } }, left: { expr: { Literal: { Value: '8D' } } }, right: { expr: { Literal: { Value: '8D' } } } } }]
  }
});

// ============================================================
// 14. Horizontal bar — Sales by Country
// ============================================================
add('aa000000000000000032', { x: 40, y: 720, z: 4, w: 580, h: 320, t: 14 }, {
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
  visualContainerObjects: {
    title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: "'Sales by Country'" } } }, fontSize: { expr: { Literal: { Value: '14D' } } } } }],
    background: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.bg}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } }],
    border: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.border}'` } } } } }, radius: { expr: { Literal: { Value: '6D' } } } } }],
    padding: [{ properties: { top: { expr: { Literal: { Value: '8D' } } }, bottom: { expr: { Literal: { Value: '8D' } } }, left: { expr: { Literal: { Value: '8D' } } }, right: { expr: { Literal: { Value: '8D' } } } } }]
  }
});

// ============================================================
// 15. Donut — Sales by Channel
// ============================================================
add('aa000000000000000033', { x: 640, y: 720, z: 4, w: 430, h: 320, t: 15 }, {
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
  visualContainerObjects: {
    title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: "'Sales by Channel'" } } }, fontSize: { expr: { Literal: { Value: '14D' } } } } }],
    background: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.bg}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } }],
    border: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.border}'` } } } } }, radius: { expr: { Literal: { Value: '6D' } } } } }],
    padding: [{ properties: { top: { expr: { Literal: { Value: '8D' } } }, bottom: { expr: { Literal: { Value: '8D' } } }, left: { expr: { Literal: { Value: '8D' } } }, right: { expr: { Literal: { Value: '8D' } } } } }]
  }
});

// ============================================================
// 16. Pivot Table — Product Profitability
// ============================================================
add('aa000000000000000034', { x: 1090, y: 720, z: 4, w: 790, h: 320, t: 16 }, {
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
  visualContainerObjects: {
    title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: "'Product Profitability'" } } }, fontSize: { expr: { Literal: { Value: '14D' } } } } }],
    background: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.bg}'` } } } } }, transparency: { expr: { Literal: { Value: '0D' } } } } }],
    border: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, color: { solid: { color: { expr: { Literal: { Value: `'${C.border}'` } } } } }, radius: { expr: { Literal: { Value: '6D' } } } } }],
    padding: [{ properties: { top: { expr: { Literal: { Value: '8D' } } }, bottom: { expr: { Literal: { Value: '8D' } } }, left: { expr: { Literal: { Value: '8D' } } }, right: { expr: { Literal: { Value: '8D' } } } } }]
  }
});

// ============================================================
// Write files
// ============================================================
fs.mkdirSync(VIS_DIR, { recursive: true });
for (const v of visuals) {
  fs.mkdirSync(path.join(VIS_DIR, v.id), { recursive: true });
  fs.writeFileSync(path.join(VIS_DIR, v.id, 'visual.json'), JSON.stringify(container(v.id, v.position, v.visual), null, 2));
}
console.log(`Wrote ${visuals.length} visuals to ${VIS_DIR}`);
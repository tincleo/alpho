import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridApi, 
  GridReadyEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../styles/ag-grid-custom.css';
import { Prospect, ServiceType } from '../types/calendar';
import { format } from 'date-fns';
import { fetchProspects } from '../lib/api';
import { Search } from 'lucide-react';
import { LayoutGrid, List, Table2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProspectKanban from '../components/kanban/ProspectKanban';
import { useQuery } from '@tanstack/react-query';

export default function Prospects() {
  const [gridApi, setGridApi] = React.useState<GridApi | null>(null);
  const [quickFilterText, setQuickFilterText] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'kanban' | 'list' | 'table'>('table');

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects'],
    queryFn: fetchProspects,
  });

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
    
    // Auto-size all columns if columnApi is available
    if (params.columnApi) {
      const allColumnIds: string[] = [];
      params.columnApi.getColumns()?.forEach((column) => {
        allColumnIds.push(column.getId());
      });
      if (allColumnIds.length > 0) {
        params.columnApi.autoSizeColumns(allColumnIds);
      }
    }
  };

  const onFilterTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuickFilterText(text);
    if (gridApi) {
      gridApi.setQuickFilter(text);
    }
  };

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  const columnDefs: ColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      sortable: true,
      filter: true,
      width: 150,
    },
    {
      field: 'location',
      headerName: 'Location',
      sortable: true,
      filter: true,
      width: 150,
    },
    {
      field: 'services',
      headerName: 'Services',
      sortable: true,
      filter: true,
      flex: 1,
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) return '';
        return params.value.map((service: { type: ServiceType }) => {
          switch (service.type) {
            case 'couch':
              return 'Couch Cleaning';
            case 'carpet':
              return 'Carpet Cleaning';
            case 'auto-detailing':
              return 'Auto Detailing';
            case 'mattress':
              return 'Mattress Cleaning';
            default:
              return service.type;
          }
        }).join(', ');
      },
    },
    {
      field: 'datetime',
      headerName: 'Date & Time',
      sortable: true,
      filter: true,
      width: 180,
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) return '';
        return format(new Date(params.value), 'MMM d, yyyy h:mm a');
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className="h-8"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-8"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="h-8"
                onClick={() => setViewMode('table')}
              >
                <Table2 className="h-4 w-4 mr-1" />
                Table
              </Button>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search prospects..."
              value={quickFilterText}
              onChange={onFilterTextChange}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>
      
      {viewMode === 'table' && (
        <div className="flex-1 ag-theme-alpine p-6">
          <AgGridReact
            rowData={prospects}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            suppressRowClickSelection={true}
            pagination={true}
            paginationPageSize={20}
            onGridReady={onGridReady}
            rowHeight={48}
            headerHeight={48}
            enableColumnHover={true}
            suppressMenuHide={true}
            suppressFloatingFilter={true}
          />
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto p-6">
          <ProspectKanban prospects={prospects} />
        </div>
      )}

      {viewMode === 'list' && (
        <div className="flex-1 p-6">
          {/* List view will be implemented later */}
          <p className="text-center text-gray-500">List view coming soon</p>
        </div>
      )}
    </div>
  );
}

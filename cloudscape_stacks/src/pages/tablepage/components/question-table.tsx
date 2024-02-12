import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '@cloudscape-design/components/header';
import { Questions } from '../data';
import Table, { TableProps } from '@cloudscape-design/components/table';
import { useCollection } from '@cloudscape-design/collection-hooks';
import Pagination from '@cloudscape-design/components/pagination';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { createApiPath } from "../../../utils/helper";

const columnDefinitions: TableProps['columnDefinitions'] = [
  {
    header: 'Level',
    cell: ({ level }) => level,
    sortingField: 'level',
    minWidth: 175,
  },
  {
    header: 'Role Title',
    cell: ({ role }) => role,
    sortingField: 'role',
    minWidth: 160,
  },
  {
    header: 'Question',
    cell: ({ question }) => question,
    sortingField: 'question',
    minWidth: 160,
  },
];

const apiUrl = createApiPath()

export const fetchData = async (setData: any, setLoading: any) => {
  try {
    const response = await axios.get(apiUrl + '/question');
    setData(response.data);
  } catch (error) {
    console.error('Error fetching questions:', error);
  } finally {
    setLoading(false);
  }
};

export default function VariationTable() {
  const [data, setData] = useState<Questions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(setData, setLoading);
  }, []);

  const { items, filterProps, filteredItemsCount, paginationProps, collectionProps } = useCollection<Questions>(
    data,
    {
      filtering: {},
      pagination: { pageSize: 20 },
      sorting: { defaultState: { sortingColumn: columnDefinitions[0] } },
      selection: {},
    }
  );

  return (
    <Table
      items={items}
      columnDefinitions={columnDefinitions}
      stickyHeader={true}
      variant="full-page"
      selectionType='single'
      resizableColumns={true}
      ariaLabels={{
        selectionGroupLabel: 'Items selection',
        itemSelectionLabel: ({ selectedItems }, item) => {
          const isItemSelected = selectedItems.filter(i => i.level === item.level).length;
          return `${item.level} is ${isItemSelected ? '' : 'not '}selected`;
        },
        tableLabel: 'Questions table',
      }}
      header={
        <Header
          variant="awsui-h1-sticky"
          counter={`(${data.length})`}
          actions={
            <SpaceBetween size="xs" direction="horizontal">
              <Button disabled={collectionProps.selectedItems?.length === 0}>Edit</Button>
              <Button href="/put-question/index.html" variant="primary">
                Create Question
              </Button>
            </SpaceBetween>
          }
        >
          Questions
        </Header>
      }
      pagination={<Pagination {...paginationProps} />}
    />
  );
}

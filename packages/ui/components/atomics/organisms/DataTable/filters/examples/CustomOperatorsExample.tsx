/** @jsxImportSource react */
'use client'

import React from 'react'
import { FilterComponent } from '../FilterComponent'
import { 
  FilterConfiguration,
  OperatorConfig,
  OperatorDefinition,
  FilterOperator
} from '../types'

// Custom component for a specific filter
const MyCustomFilterComponent = ({ filterId, value, onChange, context }: any) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        value={value || 0}
        onChange={(e) => onChange(filterId, Number(e.target.value))}
        className="w-[100px]"
      />
      <span>{value || 0}</span>
    </div>
  )
}

// Define custom operators
const customOperatorConfig: OperatorConfig = {
  operators: {
    // Define a completely new operator
    'isEven': {
      value: 'isEven',
      label: 'Is Even',
      // Evaluator function for custom operator
      evaluator: (targetValue) => {
        return Number(targetValue) % 2 === 0
      }
    },
    'isOdd': {
      value: 'isOdd',
      label: 'Is Odd',
      evaluator: (targetValue) => {
        return Number(targetValue) % 2 !== 0
      }
    },
    // Override existing operator
    'contains': {
      value: 'contains',
      label: 'Contains (case sensitive)',
      evaluator: (targetValue, filterValue) => {
        // Case sensitive version (different from default)
        return String(targetValue).includes(String(filterValue))
      }
    },
    // Add custom operator for our custom component
    'withinRange': {
      value: 'withinRange',
      label: 'Within Range',
      evaluator: (targetValue, filterValue) => {
        return Number(targetValue) <= Number(filterValue)
      }
    }
  },
  // Set which operators to use for which filter types
  typeOperators: {
    'number': ['equals', 'greaterThan', 'lessThan', 'isEven', 'isOdd'],
    'text': ['contains', 'startsWith', 'endsWith', 'equals', 'isEmpty'],
    'custom': ['withinRange']
  }
}

// Define filter configuration
const filterConfig: FilterConfiguration = {
  filters: [
    {
      id: 'name',
      label: 'Name',
      type: 'text',
      // Configure specific operators for this filter (optional)
      operators: ['contains', 'equals'],
      placeholder: 'Filter by name...'
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      // For this field, we use all the operators defined for 'number' type
    },
    {
      id: 'score',
      label: 'Score',
      type: 'custom',
      // Use our custom component
      component: MyCustomFilterComponent,
      // Provide any context data needed by the component
      context: {
        min: 0,
        max: 100
      }
    }
  ],
  // Pass our custom operator configuration
  operatorConfig: customOperatorConfig,
  // Global context that will be available to all filters
  context: {
    // Could contain any shared data
    theme: 'light'
  }
}

// Sample data for the table
const sampleData = [
  { id: 1, name: 'John Doe', age: 30, score: 75 },
  { id: 2, name: 'Jane Smith', age: 25, score: 90 },
  { id: 3, name: 'Bob Johnson', age: 40, score: 60 },
  { id: 4, name: 'Alice Brown', age: 35, score: 85 },
  { id: 5, name: 'Charlie Wilson', age: 22, score: 95 }
]

export function CustomOperatorsExample() {
  const [filteredData, setFilteredData] = React.useState(sampleData)

  // Handle filter changes
  const handleFilter = (state: any) => {
    // Create filter manager instance (this is normally done inside the FilterComponent)
    // but we need it here to filter our data manually for the example
    const { filterManager } = state
    
    // Filter the data
    const filtered = sampleData.filter(row => filterManager.evaluateRow(row))
    setFilteredData(filtered)
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Custom Operators Example</h1>
      
      {/* Filter component with our custom configuration */}
      <div className="border rounded-md p-4 bg-gray-50">
        <FilterComponent 
          config={filterConfig} 
          onChange={handleFilter}
        />
      </div>
      
      {/* Simple table to show results */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Age</th>
              <th className="p-2 text-left">Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(row => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.id}</td>
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.age}</td>
                <td className="p-2">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredData.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          No matching records found
        </div>
      )}
    </div>
  )
}
import { 
  parseFilterToDirectus, 
  parseFilterState, 
  ParseFilterOptions 
} from './filterParser';
import { FilterState, AdvancedFilterState, FilterGroup } from './types';

describe('Filter Parser', () => {
  // Test basic filter parsing
  describe('parseFilterState', () => {
    it('should parse a simple equals filter', () => {
      const filter: FilterState = {
        id: 'title',
        operator: 'equals',
        value: 'Directus'
      };

      const result = parseFilterState(filter);
      expect(result).toEqual({
        title: {
          _eq: 'Directus'
        }
      });
    });

    it('should apply custom operator mapping', () => {
      const filter: FilterState = {
        id: 'title',
        operator: 'contains',
        value: 'Directus'
      };

      const options: ParseFilterOptions = {
        operatorMapping: {
          'contains': '_icontains'  // Use case-insensitive contains
        }
      };

      const result = parseFilterState(filter, options);
      expect(result).toEqual({
        title: {
          _icontains: 'Directus'
        }
      });
    });

    it('should handle field transformation', () => {
      const filter: FilterState = {
        id: 'title',
        operator: 'equals',
        value: 'Directus'
      };

      const options: ParseFilterOptions = {
        fieldTransformer: (field) => `${field}_transformed`
      };

      const result = parseFilterState(filter, options);
      expect(result).toEqual({
        title_transformed: {
          _eq: 'Directus'
        }
      });
    });

    it('should apply value transformation', () => {
      const filter: FilterState = {
        id: 'date',
        operator: 'equals',
        value: 'today'
      };

      const options: ParseFilterOptions = {
        valueTransformer: (value, operator, field) => {
          if (field === 'date' && value === 'today') {
            return '$NOW';
          }
          return value;
        }
      };

      const result = parseFilterState(filter, options);
      expect(result).toEqual({
        date: {
          _eq: '$NOW'
        }
      });
    });

    it('should handle relational fields', () => {
      const filter: FilterState = {
        id: 'author.name',
        operator: 'equals',
        value: 'Rijk van Zanten'
      };

      const result = parseFilterState(filter);
      expect(result).toEqual({
        author: {
          name: {
            _eq: 'Rijk van Zanten'
          }
        }
      });
    });
  });

  // Test filter manager state parsing
  describe('parseFilterToDirectus', () => {
    it('should parse basic filters with AND logic', () => {
      const state = {
        filters: [
          {
            id: 'title',
            operator: 'contains',
            value: 'Directus'
          },
          {
            id: 'status',
            operator: 'equals',
            value: 'published'
          }
        ]
      };

      const result = parseFilterToDirectus(state);
      expect(result).toEqual({
        _and: [
          {
            title: {
              _contains: 'Directus'
            }
          },
          {
            status: {
              _eq: 'published'
            }
          }
        ]
      });
    });

    it('should parse a single filter without wrapping in _and', () => {
      const state = {
        filters: [
          {
            id: 'title',
            operator: 'contains',
            value: 'Directus'
          }
        ]
      };

      const result = parseFilterToDirectus(state);
      expect(result).toEqual({
        title: {
          _contains: 'Directus'
        }
      });
    });

    it('should parse advanced filter state', () => {
      const state = {
        advancedFilter: {
          logicOperator: 'OR',
          conditions: [
            {
              field: 'title',
              operator: 'contains',
              value: 'Directus'
            },
            {
              field: 'status',
              operator: 'in',
              value: ['published', 'draft']
            }
          ]
        }
      };

      const result = parseFilterToDirectus(state);
      expect(result).toEqual({
        _or: [
          {
            title: {
              _contains: 'Directus'
            }
          },
          {
            status: {
              _in: ['published', 'draft']
            }
          }
        ]
      });
    });

    it('should parse complex filter groups with nested logic', () => {
      const state = {
        rootGroup: {
          id: 'root',
          logicOperator: 'OR',
          conditions: [],
          groups: [
            {
              id: 'group1',
              logicOperator: 'AND',
              conditions: [
                {
                  id: 'cond1',
                  field: 'user_created',
                  operator: 'equals',
                  value: '$CURRENT_USER'
                },
                {
                  id: 'cond2',
                  field: 'status',
                  operator: 'in',
                  value: ['published', 'draft']
                }
              ],
              active: true
            },
            {
              id: 'group2',
              logicOperator: 'AND',
              conditions: [
                {
                  id: 'cond3',
                  field: 'user_created',
                  operator: 'not_equals',
                  value: '$CURRENT_USER'
                },
                {
                  id: 'cond4',
                  field: 'status',
                  operator: 'in',
                  value: ['published']
                }
              ],
              active: true
            }
          ],
          active: true
        }
      };

      const result = parseFilterToDirectus(state);
      expect(result).toEqual({
        _or: [
          {
            _and: [
              {
                user_created: {
                  _eq: '$CURRENT_USER'
                }
              },
              {
                status: {
                  _in: ['published', 'draft']
                }
              }
            ]
          },
          {
            _and: [
              {
                user_created: {
                  _neq: '$CURRENT_USER'
                }
              },
              {
                status: {
                  _in: ['published']
                }
              }
            ]
          }
        ]
      });
    });

    it('should handle inactive conditions by excluding them', () => {
      const state = {
        rootGroup: {
          id: 'root',
          logicOperator: 'AND',
          conditions: [
            {
              id: 'cond1',
              field: 'title',
              operator: 'contains',
              value: 'Directus',
              active: true
            },
            {
              id: 'cond2',
              field: 'status',
              operator: 'equals',
              value: 'archived',
              active: false // This should be excluded
            }
          ],
          active: true
        }
      };

      const result = parseFilterToDirectus(state);
      expect(result).toEqual({
        title: {
          _contains: 'Directus'
        }
      });
    });

    it('should handle inactive groups by excluding them', () => {
      const state = {
        rootGroup: {
          id: 'root',
          logicOperator: 'OR',
          conditions: [],
          groups: [
            {
              id: 'group1',
              logicOperator: 'AND',
              conditions: [
                {
                  id: 'cond1',
                  field: 'title',
                  operator: 'contains',
                  value: 'Directus'
                }
              ],
              active: true
            },
            {
              id: 'group2',
              logicOperator: 'AND',
              conditions: [
                {
                  id: 'cond2',
                  field: 'status',
                  operator: 'equals',
                  value: 'published'
                }
              ],
              active: false // This group should be excluded
            }
          ],
          active: true
        }
      };

      const result = parseFilterToDirectus(state);
      expect(result).toEqual({
        title: {
          _contains: 'Directus'
        }
      });
    });

    it('should return empty object for empty filters', () => {
      expect(parseFilterToDirectus({})).toEqual({});
      expect(parseFilterToDirectus({ filters: [] })).toEqual({});
      expect(parseFilterToDirectus({ advancedFilter: null })).toEqual({});
      expect(parseFilterToDirectus({ rootGroup: { id: 'root', logicOperator: 'AND', conditions: [], active: true } })).toEqual({});
    });
  });

  // Test the custom transformers
  describe('Custom transformers', () => {
    it('should support complex custom transformations', () => {
      const state = {
        filters: [
          {
            id: 'date',
            operator: 'less_than',
            value: 'lastMonth'
          },
          {
            id: 'owner',
            operator: 'equals',
            value: 'me'
          }
        ]
      };

      const options: ParseFilterOptions = {
        // Custom operator mapping
        operatorMapping: {
          'less_than': '_lt',
          'equals': '_eq'
        },
        // Custom value transformer
        valueTransformer: (value, operator, field) => {
          if (field === 'date') {
            if (value === 'lastMonth') {
              return '$NOW(-1 month)';
            }
          }
          if (field === 'owner' && value === 'me') {
            return '$CURRENT_USER';
          }
          return value;
        }
      };

      const result = parseFilterToDirectus(state, options);
      expect(result).toEqual({
        _and: [
          {
            date: {
              _lt: '$NOW(-1 month)'
            }
          },
          {
            owner: {
              _eq: '$CURRENT_USER'
            }
          }
        ]
      });
    });

    it('should handle custom relation separator', () => {
      const filter: FilterState = {
        id: 'author:name',  // Using : as separator instead of .
        operator: 'equals',
        value: 'Rijk van Zanten'
      };

      const options: ParseFilterOptions = {
        relationSeparator: ':' // Custom separator
      };

      const result = parseFilterState(filter, options);
      expect(result).toEqual({
        author: {
          name: {
            _eq: 'Rijk van Zanten'
          }
        }
      });
    });
  });

  // Test specific Directus examples from the docs
  describe('Match Directus documentation examples', () => {
    it('should handle the title contains example', () => {
      const filter: FilterState = {
        id: 'title',
        operator: 'contains',
        value: 'Directus'
      };

      const result = parseFilterState(filter);
      expect(result).toEqual({
        title: {
          _contains: 'Directus'
        }
      });
    });

    it('should handle the owner equals dynamic variable example', () => {
      const filter: FilterState = {
        id: 'owner',
        operator: 'equals',
        value: '$CURRENT_USER'
      };

      const result = parseFilterState(filter);
      expect(result).toEqual({
        owner: {
          _eq: '$CURRENT_USER'
        }
      });
    });

    it('should handle the datetime less than or equal dynamic variable example', () => {
      const filter: FilterState = {
        id: 'datetime',
        operator: 'less_than_or_equal',
        value: '$NOW'
      };

      const result = parseFilterState(filter);
      expect(result).toEqual({
        datetime: {
          _lte: '$NOW'
        }
      });
    });

    it('should handle the category is null example', () => {
      const filter: FilterState = {
        id: 'category',
        operator: 'is_empty',
        value: true
      };

      const result = parseFilterState(filter);
      expect(result).toEqual({
        category: {
          _null: true
        }
      });
    });
    
    it('should handle the complex nested logic example', () => {
      const state = {
        rootGroup: {
          id: 'root',
          logicOperator: 'OR',
          conditions: [],
          groups: [
            {
              id: 'group1',
              logicOperator: 'AND',
              conditions: [
                {
                  id: 'cond1',
                  field: 'user_created',
                  operator: 'equals',
                  value: '$CURRENT_USER'
                },
                {
                  id: 'cond2',
                  field: 'status',
                  operator: 'in',
                  value: ['published', 'draft']
                }
              ]
            },
            {
              id: 'group2',
              logicOperator: 'AND',
              conditions: [
                {
                  id: 'cond3',
                  field: 'user_created',
                  operator: 'not_equals',
                  value: '$CURRENT_USER'
                },
                {
                  id: 'cond4',
                  field: 'status',
                  operator: 'in',
                  value: ['published']
                }
              ]
            }
          ]
        }
      };

      const result = parseFilterToDirectus(state);
      expect(result).toEqual({
        _or: [
          {
            _and: [
              {
                user_created: {
                  _eq: '$CURRENT_USER'
                }
              },
              {
                status: {
                  _in: ['published', 'draft']
                }
              }
            ]
          },
          {
            _and: [
              {
                user_created: {
                  _neq: '$CURRENT_USER'
                }
              },
              {
                status: {
                  _in: ['published']
                }
              }
            ]
          }
        ]
      });
    });
  });
});
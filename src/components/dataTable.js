(() => ({
  name: 'DataTable Filter',
  type: 'CONTENT_COMPONENT',
  allowedTypes: ['DATATABLE_COLUMN'],
  orientation: 'HORIZONTAL',
  jsx: (() => {
    const {
      Children,
      env,
      getProperty,
      GetMe,
      InteractionScope,
      ModelProvider,
      useAllQuery,
      useFilter,
      useText,
    } = B;
    const {
      Table,
      TableBody,
      TableContainer,
      TableHead,
      TableRow,
      TableCell,
      TablePagination,
      Paper,
      Toolbar,
      TextField,
      InputAdornment,
      Checkbox,
      Tooltip,
    } = window.MaterialUI.Core;
    const {
      Search,
      CheckBoxOutlineBlank,
      CheckBox,
      IndeterminateCheckBox,
    } = window.MaterialUI.Icons;
    const isDev = env === 'dev';
    const {
      take,
      placeholderTake,
      size,
      model,
      authProfile,
      filter,
      searchProperty,
      hideSearch,
      orderProperty,
      sortOrder,
      labelRowsPerPage,
      labelNumberOfPages,
      labelSearchOn,
      square,
      striped,
      elevation,
      variant,
      stickyHeader,
      title,
      pagination,
      showError,
      autoLoadOnScroll,
      autoLoadTakeAmount,
      filterTimeout,
      rowSelection,
      labelRowsSelection,
      checkboxSize,
      checkboxColor,
      showTextTooltip,
      // rowClick,
      // linkTo,
      // linkType,
      // linkToExternal,
    } = options;
    const repeaterRef = React.createRef();
    const tableRef = React.createRef();
    const tableContainerRef = React.createRef();
    const displayError = showError === 'built-in';
    const [page, setPage] = useState(0);
    const takeNum = parseInt(take, 10);
    const initialRender = useRef(true);
    const skipAppend = useRef(false);
    const [skip, setSkip] = useState(0);
    const loadOnScroll = pagination === 'never' && autoLoadOnScroll;
    const autoLoadTakeAmountNum = parseInt(autoLoadTakeAmount, 10);
    const [rowsPerPage, setRowsPerPage] = useState(takeNum);
    const [search, setSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [interactionSearchTerm, setInteractionSearchTerm] = useState('');
    const [interactionSearchProperty, setInteractionSearchProperty] = useState(
      ''
    );
    const [startFiltering, setStartFiltering] = useState('');
    const [
      previousInteractionSearchTerm,
      setPreviousInteractionSearchTerm,
    ] = useState('');
    const [
      previousInteractionSearchProperty,
      setPreviousInteractionSearchProperty,
    ] = useState('');
    const [showPagination, setShowPagination] = useState(false);
    const [interactionFilter, setInteractionFilter] = useState({});
    const { label: searchPropertyLabel = '{property}' } =
      getProperty(searchProperty) || {};
    let orderPropertyPath = null;
    if (orderProperty && Array.isArray(orderProperty.id)) {
      orderPropertyPath = orderProperty.id;
    } else if (orderProperty && orderProperty.id) {
      orderPropertyPath = [orderProperty.id];
    }
    const [orderBy, setOrderBy] = React.useState({
      field: orderPropertyPath,
      order: orderProperty ? sortOrder : null,
    });
    const [results, setResults] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [previousSearchTerm, setPreviousSearchTerm] = useState('');
    const [newSearch, setNewSearch] = useState(false);
    const fetchingNextSet = useRef(false);
    const [initialTimesFetched, setInitialTimesFetched] = useState(0);
    const amountOfRows = loadOnScroll ? autoLoadTakeAmountNum : rowsPerPage;
    const [storedData, setStoredData] = useState();
    const [firstLoad, setFirstLoad] = useState(true);
    const [selectedValues, setSelectedValues] = useState([]);
    const [selectedAllValues, setSelectedAllValues] = useState(false);
    const possibleSelectionValues = [];

    const createSortObject = (fields, order) => {
      const sort = fields.reduceRight((acc, property, index) => {
        const prop = getProperty(property);
        return index === fields.length - 1
          ? { [prop.name]: order.toUpperCase() }
          : { [prop.name]: acc };
      }, {});

      return sort;
    };

    const [variables, setVariables] = useState(
      orderPropertyPath
        ? {
            sort: {
              relation:
                !isDev && createSortObject(orderPropertyPath, sortOrder),
            },
          }
        : {}
    );

    const titleText = useText(title);
    const hasToolbar = titleText || (searchProperty && !hideSearch);
    const elevationLevel = variant === 'flat' ? 0 : elevation;

    const toolbarRef = React.createRef();
    const paginationRef = React.createRef();
    const [stylesProps, setStylesProps] = useState(null);

    const deepMerge = (...objects) => {
      const isObject = (item) =>
        item && typeof item === 'object' && !Array.isArray(item);

      return objects.reduce((accumulator, object) => {
        Object.keys(object).forEach((key) => {
          const accumulatorValue = accumulator[key];
          const value = object[key];
          if (Array.isArray(accumulatorValue) && Array.isArray(value)) {
            accumulator[key] = accumulatorValue.concat(value);
          } else if (isObject(accumulatorValue) && isObject(value)) {
            accumulator[key] = deepMerge(accumulatorValue, value);
          } else {
            accumulator[key] = value;
          }
        });
        return accumulator;
      }, {});
    };

    let path = [searchProperty].flat();
    if (typeof searchProperty.id !== 'undefined') {
      path = [searchProperty.id].flat();
    }

    const transformValue = (value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }

      return value;
    };
    /**
     * @name Filter
     * @param {Property} property
     * @returns {Void}
     */
    // eslint-disable-next-line prettier/prettier
    B.defineFunction('Filtering', (filterArray) => {
      setStartFiltering(filterArray);
    });

    useEffect(() => {
      const handler = setTimeout(() => {
        const event = startFiltering[1];
        const property = startFiltering[0];
        const interactionId = startFiltering[2];

        if (typeof event === 'undefined') return;

        setInteractionFilter({
          ...interactionFilter,
          [interactionId]: {
            property,
            value: event.target ? event.target.value : transformValue(event),
          },
        });

        setInteractionSearchTerm(
          event.target ? event.target.value : transformValue(event)
        );
        setInteractionSearchProperty(property ? property.id : '');
      }, filterTimeout);

      return () => {
        clearTimeout(handler);
      };
    }, [startFiltering]);

    B.defineFunction('ResetFilter', () => {
      setInteractionFilter({});
      setInteractionSearchTerm('');
      setInteractionSearchProperty('');
    });

    let interactionFilters = {};

    const isEmptyValue = (value) =>
      !value || (Array.isArray(value) && value.length === 0);

    // const processValue = value =>
    //   Object.entries(value)
    //     // .filter(([, { value2 }]) => !isEmptyValue(value2))
    //     .map(([, { property, value }]) =>
    //       property.id.reduceRight((acc, field, index, arr) => {
    //         const isLast = index === arr.length - 1;
    //         if (isLast) {
    //           return { [field]: { [property.operator]: value } };
    //         }
    //         // this is where the first layer(s) are put
    //         return { [field]: acc };
    //       }, {}),
    //     );

    const processValue = (value, property, field) => ({
      [field]: { [property.operator]: value },
    });

    const processArray = (value, property, field) => ({
      _or: value.map((el) => processValue(el, property, field)),
    });

    const processObjects = (value, property, field) => ({
      _and: value.map((el) =>
        Array.isArray(el.and)
          ? processArray(el.and, property, field)
          : processValue(el.and, property, field)
      ),
    });

    const clauses = Object.entries(interactionFilter)
      .filter(([, { value }]) => !isEmptyValue(value))
      .map(([, { property, value }]) =>
        property.id.reduceRight((acc, field, index, arr) => {
          const isLast = index === arr.length - 1;
          if (isLast && Array.isArray(value) && !value[0].and) {
            return processArray(value, property, field);
          }
          if (isLast && Array.isArray(value)) {
            return processObjects(value, property, field);
          }

          // if (Array.isArray(value) && !value[0].and) {
          //   const key = '_and';
          //   return { key: { [field]: acc } };
          // }
          // if (Array.isArray(value)) {
          //   const key = '_or';
          //   return { key: { [field]: acc } };
          // }

          if (isLast) {
            return processValue(value, property, field);
          }
          return { [field]: acc };
        }, {})
      );

    interactionFilters =
      clauses.length > 1 ? { _and: clauses } : clauses[0] || {};

    const searchFilter = searchProperty
      ? path.reduceRight(
          (acc, property, index) =>
            index === path.length - 1
              ? { [property]: { matches: searchTerm } }
              : { [property]: acc },
          {}
        )
      : {};

    const newFilter =
      searchProperty && searchTerm !== ''
        ? deepMerge(filter, searchFilter)
        : filter;

    const completeFilter = deepMerge(newFilter, interactionFilters);

    const where = useFilter(completeFilter);

    // TODO: move model to skip

    const { loading, error, data, refetch } = useAllQuery(model, {
      rawFilter: where,
      variables,
      skip: loadOnScroll ? skip : page * rowsPerPage,
      take: loadOnScroll ? autoLoadTakeAmountNum : rowsPerPage,
      onCompleted(res) {
        const hasResult = res && res.results && res.results.length > 0;
        if (!firstLoad) {
          // eslint-disable-next-line object-shorthand
          const storageResults = { data: data, key: 'storedResults' };
          B.triggerEvent('SetLocalStorage', storageResults);
          const storageFilters = {
            data: interactionFilter,
            key: 'storedFilters',
          };
          const logging = {
            storageResults,
            storageFilters,
          };
          // console.log(logging);
          B.triggerEvent('SetLogging', logging);
          B.triggerEvent('SetLocalStorage', storageFilters);
        } else {
          setFirstLoad(false);
        }
        if (hasResult) {
          B.triggerEvent('onSuccess', res.results);
        } else {
          B.triggerEvent('onNoResults');
        }
      },
      onError(err) {
        if (!displayError) {
          B.triggerEvent('onError', err);
        }
      },
    });

    useEffect(() => {
      if (!isDev && storedData) {
        // Not sure if this one's actually fired or useful, second call is made anyway
        if (pagination !== 'never') {
          setResults(storedData.results);
          setTotalCount(storedData.totalCount);
          return;
        }
        setResults(storedData.results);
        setNewSearch(false);
        setTotalCount(storedData.totalCount);
      } else if (!isDev && data) {
        if (pagination !== 'never') {
          setResults(data.results);
          setTotalCount(data.totalCount);
          return;
        }
        if (
          searchTerm !== previousSearchTerm ||
          interactionSearchTerm !== previousInteractionSearchTerm ||
          interactionSearchProperty !== previousInteractionSearchProperty
        ) {
          setSkip(0);
          setInitialTimesFetched(0);
          setPreviousSearchTerm(searchTerm);
          setPreviousInteractionSearchTerm(interactionSearchTerm);
          setPreviousInteractionSearchProperty(interactionSearchProperty);
          setNewSearch(true);
        } else {
          if (
            newSearch ||
            (!autoLoadOnScroll && skipAppend.current) ||
            (pagination === 'never' && !autoLoadOnScroll)
          ) {
            setResults(data.results);
          } else {
            setResults((prev) => [...prev, ...data.results]);
          }
          fetchingNextSet.current = false;
          setNewSearch(false);
        }
        skipAppend.current = false;
        setTotalCount(data.totalCount);
      }
    }, [
      data,
      storedData,
      searchTerm,
      interactionSearchTerm,
      interactionSearchProperty,
    ]);

    useEffect(() => {
      if (!isDev && data) {
        if (pagination !== 'never') {
          setResults(data.results);
          setTotalCount(data.totalCount);
          return;
        }
        if (searchTerm !== previousSearchTerm) {
          setSkip(0);
          setInitialTimesFetched(0);
          setPreviousSearchTerm(searchTerm);
          setNewSearch(true);
        } else {
          if (newSearch || (!autoLoadOnScroll && skipAppend.current)) {
            setResults(data.results);
          } else {
            setResults((prev) => [...prev, ...data.results]);
          }
          fetchingNextSet.current = false;
          setNewSearch(false);
        }
        skipAppend.current = false;
        setTotalCount(data.totalCount);
      }
    }, [data, searchTerm]);

    useEffect(() => {
      const handler = setTimeout(() => {
        setSearchTerm(search);
      }, filterTimeout);

      return () => {
        clearTimeout(handler);
      };
    }, [search]);

    function clearResults() {
      setInitialTimesFetched(0);
      setResults([]);
      setTimeout(() => {
        setSkip(0);
      }, 0);
    }

    B.defineFunction('Refetch', () => {
      if (pagination === 'never') {
        clearResults();
        skipAppend.current = true;
        setTimeout(() => {
          refetch();
        }, 0);
      } else {
        refetch();
      }
    });

    B.defineFunction('SetSearchValue', (event) => {
      setSearch(event.target.value);
    });

    B.defineFunction('GetStoredObjectTriggerTest', () => {
      B.triggerEvent('GetStoredObject', ['storedResults', 'storedFilters']);
    });

    B.defineFunction('GotStoredObject', (storedObject) => {
      if (Object.keys(storedObject)[0] === 'results') {
        setStoredData(storedObject);
      } else {
        setInteractionFilter(storedObject);
      }
    });

    B.defineFunction('ResetRowSelection', () => {
      setSelectedValues([]);
    });

    useEffect(() => {
      if (!isDev) return;
      const placeholders = placeholderTake || amountOfRows;
      const repeat = () => {
        if (!repeaterRef.current) return;
        if (repeaterRef.current.previousElementSibling.children.length === 0) {
          return;
        }
        repeaterRef.current.innerHTML = '';
        for (let i = 0, j = placeholders - 1; i < j; i += 1) {
          repeaterRef.current.innerHTML +=
            repeaterRef.current.previousElementSibling.children[0].outerHTML;
        }
        if (striped) {
          const childrenLenght = children.length;
          const collection = Array.from(repeaterRef.current.children);
          collection
            .filter((item) => item.tagName === 'DIV')
            .forEach((item, index) => {
              if (
                ((Math.ceil((index + 1) / childrenLenght) * childrenLenght) /
                  childrenLenght) %
                  2 ===
                0
              ) {
                item.classList.add('striped');
              }
            });
        }
      };
      const mutationObserver = new MutationObserver(() => {
        repeat();
      });
      mutationObserver.observe(tableRef.current, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
        attributeOldValue: false,
        characterDataOldValue: false,
      });
      repeat();
    });

    useEffect(() => {
      setRowsPerPage(takeNum);
    }, [takeNum]);

    const mounted = useRef(false);

    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    useEffect(() => {
      if (mounted.current && loading) {
        B.triggerEvent('onLoad', loading);
      }
    }, [loading]);

    useEffect(() => {
      B.triggerEvent('onRowSelection', selectedValues);
      if (selectedValues.length === 0) B.triggerEvent('onNoRowSelected');
      if (
        selectedValues.length > 0 &&
        selectedValues.sort().toString() ===
          possibleSelectionValues.sort().toString()
      ) {
        setSelectedAllValues(true);
      } else {
        setSelectedAllValues(false);
      }
    }, [selectedValues]);

    const handleChangePage = (_, newPage) => {
      if (loading || error) return;
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
      if (loading || error) return;
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };

    const handleSort = (field, newOrder) => {
      if (isDev) return;
      setOrderBy({ field, order: newOrder });
      setVariables({
        sort: {
          relation: createSortObject(field, newOrder),
        },
      });
    };

    const handleSearch = (event) => {
      setSearch(event.target.value);
    };

    // const handleRowClick = (endpoint, context) => {
    //   if (isDev) return;
    //   B.triggerEvent('OnRowClick', endpoint, context);
    //   window.top.location.href = endpoint;
    // };

    const handleSelection = (e, data) => {
      let currentValues = [...selectedValues];
      if (e.target.checked) {
        currentValues.push(data.id);
        setSelectedValues(currentValues);
      } else {
        const index = currentValues.indexOf(data.id);
        if (index !== -1) {
          currentValues.splice(index, 1);
          setSelectedValues(currentValues);
        }
      }
    };

    const handleAllSelection = (e) => {
      if (
        selectedValues.sort().toString() !==
        possibleSelectionValues.sort().toString()
      ) {
        setSelectedValues(possibleSelectionValues);
        setSelectedAllValues(true);
      } else {
        setSelectedValues([]);
        setSelectedAllValues(false);
      }
    };

    const renderTableHead = () => {
      if ((loading && !loadOnScroll) || error) {
        return Array.from(Array(children.length).keys()).map((colIdx) => (
          <TableCell key={colIdx}>
            <div className={classes.skeleton}>
              {error && displayError && error.message}
            </div>
          </TableCell>
        ));
      }
      return (
        <Children headerOnly handleSort={handleSort} orderBy={orderBy}>
          {children}
        </Children>
      );
    };

    const tableContentModel = () => {
      if ((loading && !loadOnScroll) || error) {
        return Array.from(Array(rowsPerPage).keys()).map((idx) => (
          <TableRow key={idx} classes={{ root: classes.bodyRow }}>
            {Array.from(Array(children.length).keys()).map((colIdx) => (
              <TableCell key={colIdx}>
                <div className={classes.skeleton} />
              </TableCell>
            ))}
          </TableRow>
        ));
      }

      const rows = results.map((value) => {
        possibleSelectionValues.push(value.id);

        return (
          <ModelProvider value={value} id={model}>
            <InteractionScope model={model}>
              {(context) => (
                <TableRow
                  key={value[0]}
                  classes={{ root: classes.bodyRow }}
                  data-id={value.id}
                >
                  {rowSelection && (
                    <TableCell
                      className={classes.rowSelectionCell}
                      key={`rs-${value.id}`}
                    >
                      <Checkbox
                        icon={
                          <CheckBoxOutlineBlank
                            className={classes.rowCheckbox}
                          />
                        }
                        checkedIcon={
                          <CheckBox className={classes.rowCheckbox} />
                        }
                        onChange={(e) => handleSelection(e, value)}
                        checked={selectedValues.includes(value.id)}
                      />
                    </TableCell>
                  )}
                  <Children
                    // rowClick={rowClick}
                    // linkType={linkType}
                    // linkTo={linkTo || linkToExternal}
                    // handleRowClick={handleRowClick}
                    showTextTooltip={showTextTooltip}
                    context={context}
                  >
                    {children}
                  </Children>
                </TableRow>
              )}
            </InteractionScope>
          </ModelProvider>
        );
      });

      if (authProfile) {
        return <GetMe authenticationProfileId={authProfile}>{rows}</GetMe>;
      }

      return rows;
    };

    const renderTableContent = () => {
      if (isDev) {
        return (
          <TableRow classes={{ root: classes.bodyRow }}>{children}</TableRow>
        );
      }

      if (model) {
        return tableContentModel();
      }

      return Array.from(Array(amountOfRows).keys()).map((idx) => (
        <TableRow key={idx} classes={{ root: classes.bodyRow }}>
          {rowSelection && (
            <TableCell className={classes.rowCheckboxCell}>
              <Checkbox
                icon={<CheckBoxOutlineBlank className={classes.rowCheckbox} />}
                checkedIcon={<CheckBox className={classes.rowCheckbox} />}
              />
            </TableCell>
          )}
          {children}
        </TableRow>
      ));
    };

    useEffect(() => {
      if (loadOnScroll && !isDev) {
        const fetchNextSet = () => {
          fetchingNextSet.current = true;
          if (!initialRender.current) {
            setSkip((prev) => prev + autoLoadTakeAmountNum);
          }
          initialRender.current = false;
        };

        const tableContainerElement = tableContainerRef.current;
        if (loadOnScroll) {
          const parent = tableContainerElement.parentNode;

          if (
            tableContainerElement.scrollHeight <= parent.clientHeight &&
            initialTimesFetched < 5
          ) {
            setInitialTimesFetched((prev) => prev + 1);
            fetchNextSet();
          }
          const scrollEvent = (e) => {
            const { scrollTop, clientHeight, scrollHeight } = e.target;
            const offset = scrollHeight / 5;
            const hitBottom = scrollTop + clientHeight >= scrollHeight - offset;
            if (hitBottom && !fetchingNextSet.current) {
              fetchNextSet();
            }
          };
          tableContainerElement.addEventListener('scroll', scrollEvent);
        }
      }
    }, [results]);

    useEffect(() => {
      if (pagination === 'never') {
        const dataResults = data && data.results;
        const needsCacheFix =
          results.length === 0 && dataResults && dataResults.length > 0;

        const setExistingData = () => {
          setResults(dataResults);
          fetchingNextSet.current = false;
        };

        if (needsCacheFix && !autoLoadOnScroll) {
          setExistingData();
        }
        if (needsCacheFix && autoLoadOnScroll && skip === 0) {
          setExistingData();
        }
        if (needsCacheFix && autoLoadOnScroll && skip !== 0) {
          setSkip(0);
        }
      }
    }, [results]);

    useEffect(() => {
      if (isDev) {
        if (pagination === 'never') {
          setShowPagination(false);
        } else {
          setShowPagination(true);
        }
      }
    }, [pagination]);

    useEffect(() => {
      if (!isDev && data) {
        switch (pagination) {
          case 'never':
            setShowPagination(false);
            break;
          case 'whenNeeded':
            if (rowsPerPage >= data.totalCount) {
              setShowPagination(false);
            } else {
              setShowPagination(true);
            }
            break;
          default:
          case 'always':
            setShowPagination(true);
            break;
        }
      }
    }, [data, rowsPerPage]);

    useEffect(() => {
      let amount = 0;
      if (hasToolbar) {
        amount += toolbarRef.current.clientHeight;
      }
      if (showPagination) {
        amount += paginationRef.current.clientHeight;
      }
      let style;
      if (amount > 0 || !hasToolbar) {
        style = {
          height: `calc(100% - ${amount}px)`,
          borderRadius: `${hasToolbar ? '0rem' : '0.1875rem'}`,
        };
        setStylesProps({ style });
      } else {
        setStylesProps(null);
      }
    }, [showPagination, hasToolbar]);

    return (
      <div className={classes.root}>
        <Paper
          classes={{ root: classes.paper }}
          square={square}
          variant={variant}
          elevation={elevationLevel}
        >
          {hasToolbar && (
            <Toolbar ref={toolbarRef} classes={{ root: classes.toolbar }}>
              {titleText && <span className={classes.title}>{titleText}</span>}
              {searchProperty && !hideSearch && (
                <TextField
                  classes={{ root: classes.searchField }}
                  placeholder={`${useText(
                    labelSearchOn
                  )} ${searchPropertyLabel}`}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  onChange={handleSearch}
                />
              )}
            </Toolbar>
          )}
          <TableContainer
            ref={tableContainerRef}
            classes={{ root: classes.container }}
            {...stylesProps}
          >
            <Table
              stickyHeader={stickyHeader}
              size={size}
              classes={{ root: classes.tableRoot }}
            >
              <TableHead>
                <TableRow classes={{ root: classes.headerRow }}>
                  {!isDev && rowSelection && (
                    <TableCell className={classes.rowCheckboxCell}>
                      <Checkbox
                        icon={
                          <CheckBoxOutlineBlank
                            className={classes.rowCheckbox}
                          />
                        }
                        checkedIcon={
                          <CheckBox className={classes.rowCheckbox} />
                        }
                        checked={selectedAllValues}
                        onChange={(e) => handleAllSelection(e)}
                      />
                    </TableCell>
                  )}
                  {renderTableHead()}
                </TableRow>
              </TableHead>
              <TableBody ref={tableRef}>{renderTableContent()}</TableBody>
              {isDev && (
                <TableBody ref={repeaterRef} className={classes.autoRepeat} />
              )}
            </Table>
          </TableContainer>
          {showPagination && (
            <>
              {isDev && rowSelection && (
                <span className={classes.rowsSelectedLabel}>
                  # {labelRowsSelection}
                </span>
              )}
              {!isDev && rowSelection && selectedValues.length > 0 && (
                <span className={classes.rowsSelectedLabel}>
                  {selectedValues.length} {labelRowsSelection}
                </span>
              )}
              <TablePagination
                ref={paginationRef}
                classes={{ root: classes.pagination }}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                labelRowsPerPage={useText(labelRowsPerPage)}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} ${useText(labelNumberOfPages)} ${count}`
                }
                component="div"
                count={model ? totalCount : takeNum}
                rowsPerPage={model ? rowsPerPage : takeNum}
                page={page}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </div>
    );
  })(),
  styles: (B) => (theme) => {
    const { env, mediaMinWidth, Styling } = B;
    const style = new Styling(theme);
    const isDev = env === 'dev';
    const getSpacing = (idx, device = 'Mobile') =>
      idx === '0' ? '0rem' : style.getSpacing(idx, device);

    return {
      root: {
        marginTop: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[0]),
        marginRight: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[1]),
        marginBottom: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[2]),
        marginLeft: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[3]),
        height: ({ options: { height } }) => height,
      },
      paper: {
        backgroundColor: ({ options: { background } }) => [
          style.getColor(background),
          '!important',
        ],
        height: '100%',
      },
      container: {
        height: '100%',
      },
      tableRoot: {
        tableLayout: 'fixed',
        '& .MuiCheckbox-root': {
          color: ({ options: { checkboxColor } }) => [
            style.getColor(checkboxColor),
            '!important',
          ],
          padding: '0 !important',
        },
        '& .MuiCheckbox-root.Mui-checked': {
          color: ({ options: { checkboxColorChecked } }) => [
            style.getColor(checkboxColorChecked),
            '!important',
          ],
        },
        '& .MuiCheckbox-root.MuiIconButton-root:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04) !important',
        },
      },
      toolbar: {
        paddingLeft: ['1rem', '!important'],
        paddingRight: ['1rem', '!important'],
      },
      rowCheckboxCell: {
        width: ({ options: { checkboxSize } }) => `${checkboxSize} !important`,
      },
      rowCheckbox: {
        fontSize: ({ options: { checkboxSize } }) =>
          `${checkboxSize} !important`,
      },
      rowsSelectedLabel: {
        position: 'absolute',
        marginTop: 26,
        marginLeft: 20,
        fontSize: '0.875rem',
        letterSpacing: '.01071em',
        lineHeight: 0,
      },
      title: {
        color: ({ options: { titleType } }) => style.getFontColor(titleType),
        fontFamily: ({ options: { titleType } }) =>
          style.getFontFamily(titleType),
        fontSize: ({ options: { titleType } }) => style.getFontSize(titleType),
        fontWeight: ({ options: { titleType } }) =>
          style.getFontWeight(titleType),
        textTransform: ({ options: { titleType } }) =>
          style.getTextTransform(titleType),
        letterSpacing: ({ options: { titleType } }) =>
          style.getLetterSpacing(titleType),
        lineHeight: '1.2',
        [`@media ${mediaMinWidth(600)}`]: {
          fontSize: ({ options: { titleType } }) =>
            style.getFontSize(titleType, 'Portrait'),
        },
        [`@media ${mediaMinWidth(960)}`]: {
          fontSize: ({ options: { titleType } }) =>
            style.getFontSize(titleType, 'Landscape'),
        },
        [`@media ${mediaMinWidth(1280)}`]: {
          fontSize: ({ options: { titleType } }) =>
            style.getFontSize(titleType, 'Desktop'),
        },
      },
      headerRow: {
        backgroundColor: ({ options: { backgroundHeader } }) => [
          style.getColor(backgroundHeader),
          '!important',
        ],
        '& div': {
          borderBottom: `${isDev ? '0.0625rem solid #cccccc' : 0}`,
        },
        '& th, & div[role="columnheader"]': {
          borderBottom: `${isDev ? 0 : '0.0625rem solid #cccccc!important'}`,
          backgroundColor: ({ options: { backgroundHeader } }) => [
            style.getColor(backgroundHeader),
            '!important',
          ],
        },
        '& > div > .MuiTableCell-head, & > .MuiTableCell-head': {
          textOverflow: ({ options: { hideTextOverflow } }) =>
            hideTextOverflow ? 'ellipsis' : 'clip',
          overflow: ({ options: { hideTextOverflow } }) =>
            hideTextOverflow ? 'hidden' : 'visible',
          whiteSpace: ({ options: { hideTextOverflow } }) =>
            hideTextOverflow ? 'nowrap' : 'normal',
          // padding: ({ options: { rowPaddingX, rowPaddingY } }) =>
          //   `clamp(9px, ${rowPaddingY}, 64px) clamp(9px, ${rowPaddingX}, 64px)`,
          padding: ({ options: { rowPaddingX, rowPaddingY } }) =>
            `${rowPaddingY} ${rowPaddingX} ${rowPaddingY} ${rowPaddingX}`,
        },
      },
      bodyRow: {
        // cursor: ({ options: { linkTo } }) =>
        //   linkTo && linkTo.id !== '' && 'pointer',
        // '&:hover td': {
        //   cursor: 'pointer',
        //   backgroundColor: ({ options: { linkTo, backgroundRowHover } }) =>
        //     linkTo && [style.getColor(backgroundRowHover), '!important'],
        // },
        '&:nth-child(odd)': {
          backgroundColor: ({ options: { striped, stripeColor } }) => [
            striped ? style.getColor(stripeColor) : 'transparent',
          ],
        },
        '& > .MuiTableCell-root, & ~ .MuiTableCell-root': {
          textOverflow: ({ options: { hideTextOverflow } }) =>
            hideTextOverflow ? 'ellipsis' : 'clip',
          overflow: ({ options: { hideTextOverflow } }) =>
            hideTextOverflow ? 'hidden' : 'visible',
          whiteSpace: ({ options: { hideTextOverflow } }) =>
            hideTextOverflow ? 'nowrap' : 'normal',
          padding: ({ options: { rowPaddingX, rowPaddingY } }) =>
            `${rowPaddingY} ${rowPaddingX} ${rowPaddingY} ${rowPaddingX}`,
          borderColor: ({ options: { rowBorderColor } }) => [
            style.getColor(rowBorderColor),
            '!important',
          ],
        },
      },
      searchField: {
        marginLeft: ['auto', '!important'],
        pointerEvents: isDev && 'none',
      },
      pagination: {
        borderRadius: '0.1875rem',
        pointerEvents: isDev && 'none',
        backgroundColor: ({ options: { background } }) => [
          style.getColor(background),
          '!important',
        ],
      },
      autoRepeat: {
        opacity: 0.5,
        '& .striped': {
          background: ({ options: { striped, stripeColor } }) => [
            striped ? style.getColor(stripeColor) : 'transparent',
            '!important',
          ],
        },
      },
      skeleton: {
        height: `calc(${style.getFont('Body1').Mobile} * 1.2)`,
        [`@media ${mediaMinWidth(600)}`]: {
          height: `calc(${style.getFont('Body1').Portrait} * 1.2)`,
        },
        [`@media ${mediaMinWidth(960)}`]: {
          height: `calc(${style.getFont('Body1').Landscape} * 1.2)`,
        },
        [`@media ${mediaMinWidth(1280)}`]: {
          height: `calc(${style.getFont('Body1').Desktop} * 1.2)`,
        },
        backgroundColor: '#eee',
        borderRadius: 8,
        overflow: 'hidden',
        '&::after': {
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundImage:
            'linear-gradient(90deg, #eee 25%, #fff 50%, #eee 75%)',
          backgroundSize: '200% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPositionX: '150%',
          borderRadius: `calc(${style.getFont('Body2').Landscape} / 2)`,
          content: '""',
          animation: 'loading 1.5s infinite',
        },
      },
      '@keyframes loading': {
        to: {
          backgroundPositionX: '-150%',
        },
      },
      [`@media ${mediaMinWidth(600)}`]: {
        root: {
          marginTop: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[0], 'Portrait'),
          marginRight: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[1], 'Portrait'),
          marginBottom: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[2], 'Portrait'),
          marginLeft: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[3], 'Portrait'),
        },
      },
      [`@media ${mediaMinWidth(960)}`]: {
        root: {
          marginTop: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[0], 'Landscape'),
          marginRight: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[1], 'Landscape'),
          marginBottom: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[2], 'Landscape'),
          marginLeft: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[3], 'Landscape'),
        },
      },
      [`@media ${mediaMinWidth(1280)}`]: {
        root: {
          marginTop: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[0], 'Desktop'),
          marginRight: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[1], 'Desktop'),
          marginBottom: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[2], 'Desktop'),
          marginLeft: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[3], 'Desktop'),
        },
      },
    };
  },
}))();

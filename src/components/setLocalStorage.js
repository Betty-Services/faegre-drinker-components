(() => ({
  name: 'setLocalStorage',
  type: 'CONTENT_COMPONENT',
  icon: 'TitleIcon',
  orientation: 'HORIZONTAL',
  allowedTypes: ['BODY_COMPONENT', 'CONTAINER_COMPONENT', 'CONTENT_COMPONENT'],
  jsx: (() => {
    const { onPremiseV9 } = options;
    const { env } = B;
    const isDev = env === 'dev';
    const Tag = {
      Title1: 'h1',
      Title2: 'h2',
      Title3: 'h3',
      Title4: 'h4',
      Title5: 'h5',
      Title6: 'h6',
      Body1: 'p',
      Body2: 'p',
    }[options.type || 'Title1'];

    B.defineFunction('SetLocalStorage', data => {
      localStorage.setItem(data.key, JSON.stringify(data.data));
    });

    B.defineFunction('SetLogging', data => {
      // console.log(data);
      const ids = data.storageResults.data.results.map(a => a.id);
      const filterKeys = Object.keys(data.storageFilters.data);
      const total = data.storageResults.data.totalCount;
      // console.log(total);
      // console.log(data.storageFilters.data);
      const filters = filterKeys.map(
        a => `[${a},${data.storageFilters.data[a].value}]`,
      );
      // console.log(filters);
      // const total = data.storageFilters.data.results.map(a => a.id);
      B.triggerEvent('SetInputIds', ids);
      B.triggerEvent('SetInputFilters', filters);
      B.triggerEvent('SetInputTotal', total);
    });

    B.defineFunction('ClearLocalStorage', () => {
      if (onPremiseV9) {
        const token = localStorage.getItem('TOKEN');
        const refreshToken = localStorage.getItem('REFRESH_TOKEN');
        localStorage.clear();
        localStorage.setItem('TOKEN', token);
        localStorage.setItem('REFRESH_TOKEN', refreshToken);
      } else {
        localStorage.clear();
      }
    });

    return isDev ? (
      <Tag className={classes.root}>
        <p>setStorage component</p>
      </Tag>
    ) : (
      <></>
    );
  })(),
  styles: B => t => {
    const style = new B.Styling(t);
    return {
      root: {
        boxSizing: 'border-box',
        position: 'relative',
        width: '100%',
        margin: 0,
        paddingTop: ({ options: { padding } }) =>
          style.getSpacing(padding[0], 'Desktop'),
        paddingRight: ({ options: { padding } }) =>
          style.getSpacing(padding[1], 'Desktop'),
        paddingBottom: ({ options: { padding } }) =>
          style.getSpacing(padding[2], 'Desktop'),
        paddingLeft: ({ options: { padding } }) =>
          style.getSpacing(padding[3], 'Desktop'),
        fontFamily: ({ options: { type } }) => style.getFontFamily(type),
        fontSize: ({ options: { type } }) => style.getFontSize(type),
        textTransform: ({ options: { type } }) => style.getTextTransform(type),
        fontWeight: ({ options: { type } }) => style.getFontWeight(type),
        letterSpacing: ({ options: { type } }) => style.getLetterSpacing(type),
        textAlign: ({ options: { align } }) => align,
        color: ({ options: { color } }) => style.getColor(color),
      },
    };
  },
}))();

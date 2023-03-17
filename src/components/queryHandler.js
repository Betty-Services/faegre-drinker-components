(() => ({
  name: 'queryHandler',
  type: 'CONTENT_COMPONENT',
  icon: 'TitleIcon',
  orientation: 'HORIZONTAL',
  allowedTypes: ['BODY_COMPONENT', 'CONTAINER_COMPONENT', 'CONTENT_COMPONENT'],
  jsx: (() => {
    const { key, valueTrue } = options;
    const { env, useText } = B;
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

    const keyText = useText(key);
    const valueTrueText = useText(valueTrue);
    const [isChecked, setIsChecked] = useState(false);

    function getQueryString() {
      const queryStringKeyValues = window.location.search
        .replace('?', '')
        .split('&');
      const qsJsonObject = {};
      if (queryStringKeyValues !== '[""]') {
        // eslint-disable-next-line array-callback-return
        queryStringKeyValues.map(queryStringKeyValue => {
          let split = [];
          split = queryStringKeyValue.split('=');
          // eslint-disable-next-line prefer-destructuring
          qsJsonObject[split[0]] = split[1];
        });
      }
      return qsJsonObject;
    }

    const queryString = getQueryString();
    const queryValue = queryString[keyText];

    if (queryValue === valueTrueText) {
      B.triggerEvent('queryTrue');
    } else {
      B.triggerEvent('queryFalse');
    }

    B.defineFunction('dataTableReload', () => {
      // eslint-disable-next-line array-callback-return
      if (!isChecked && queryValue === valueTrueText) {
        setIsChecked(true);
        B.triggerEvent('dataTableReload');
      }
    });

    return isDev ? (
      <Tag className={classes.root}>
        <p>queryHandler component</p>
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

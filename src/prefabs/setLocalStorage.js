(() => ({
  name: 'setLocalStorage',
  icon: 'TitleIcon',
  category: 'CONTENT',
  structure: [
    {
      name: 'setLocalStorage',
      options: [
        {
          value: false,
          label: 'On premise v9',
          key: 'onPremiseV9',
          type: 'TOGGLE',
        },
        {
          value: [''],
          label: 'Logging URL',
          key: 'loggingUrl',
          // key: 'linkTo',
          type: 'VARIABLE',
          configuration: {
            placeholder: 'Starts with https:// or http://',
            condition: {
              type: 'SHOW',
              option: 'linkType',
              comparator: 'EQ',
              value: 'external',
            },
          },
        },
        {
          type: 'FONT',
          label: 'Type',
          key: 'type',
          value: 'Title1',
        },
        {
          type: 'CUSTOM',
          label: 'Align',
          key: 'align',
          value: 'center',
          configuration: {
            as: 'BUTTONGROUP',
            dataType: 'string',
            allowedInput: [
              { name: 'Left', value: 'left' },
              { name: 'Center', value: 'center' },
              { name: 'Right', value: 'right' },
            ],
          },
        },
        {
          type: 'SIZES',
          label: 'Padding',
          key: 'padding',
          value: ['S', 'S', 'S', 'S'],
        },
        {
          type: 'COLOR',
          label: 'Color',
          key: 'color',
          value: 'Black',
        },
      ],
      descendants: [],
    },
  ],
}))();

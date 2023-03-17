(() => ({
  name: 'queryHandler',
  icon: 'TitleIcon',
  category: 'CONTENT',
  structure: [
    {
      name: 'queryHandler',
      options: [
        {
          value: [],
          label: 'Key',
          key: 'key',
          type: 'VARIABLE',
        },
        {
          value: [],
          label: 'True value',
          key: 'valueTrue',
          type: 'VARIABLE',
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

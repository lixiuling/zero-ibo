module.exports = {
  "printWidth": 120, //超过最大值换行  
  "semi": false, // 句尾添加分号
  "singleQuote": true, // 使用单引号代替双引号
  "jsxSingleQuote": true, // 在jsx中使用单引号代替双引号    
  "trailingComma": 'all',
  "bracketSpacing": true, // 在对象，数组括号与文字之间加空格 "{ foo: bar }"
  "jsxBracketSameLine": true, // 在jsx中把'>' 是否单独放一行   
  "arrowParens": "avoid", //  (x) => {} 箭头函数参数只有一个时是否要有小括号。avoid：省略括号
  "insertPragma": true,
  "tabWidth": 2, // 缩进字节数
  "useTabs": true, // 缩进使用tab，不使用空格
  "proseWrap": 'preserve', // 默认值。因为使用了一些折行敏感型的渲染器（如GitHub comment）而按照markdown文本样式进行折行 
  "disableLanguages": ['vue'], // 不格式化vue文件，vue文件的格式化单独设置   
  "endOfLine": '', // 结尾是 \n \r \n\r auto 
  "eslintIntegration": true, // 不让prettier使用eslint的代码格式进行校验 
  // "parser": "babylon", // 格式化的解析器，默认是babylon 
}
/** @format */

// eslint: ESlint核心代码
// @typescript-eslint/parser：ESLint的解析器，用于解析typescript，从而检查和规范Typescript代码
// @typescript-eslint/eslint-plugin：这是一个ESLint插件，包含了各类定义好的检测Typescript代码的规范
// eslint-plugin-react: TS项目中同时使用了React，那么为了检测和规范React代码的书写必须安装
// prettier: prettier插件的核心代码
// eslint-config-prettier: 解决ESLint中的样式规范和prettier中样式规范的冲突，以prettier的样式规范为准，使ESLint中的样式规范自动失效
// eslint-plugin-prettier: 将prettier作为ESLint规范来使用

module.exports = {
	parser: '@typescript-eslint/parser', //定义ESLint的解析器
	extends: [
		//定义文件继承的子规范
		'plugin:react/recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier', // 使得@typescript-eslint中的样式规范失效，遵循prettier中的样式规范
		'plugin:prettier/recommended', // 使用prettier中的样式规范，且如果使得ESLint会检测prettier的格式问题，同样将格式问题以error的形式抛出
	],
	plugins: [
		//定义了该eslint文件所依赖的插件
		'@typescript-eslint',
	],
	env: {
		// 指定代码的运行环境
		browser: true,
		jasmine: true,
		jest: true,
	},
	settings: {
		//自动发现React的版本，从而进行规范react代码
		react: {
			pragma: 'React',
			version: 'detect',
		},
	},
	parserOptions: {
		//指定ESLint可以解析JSX语法
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	rules: {},
	// "rules": {
	//   // disable the rule for all files
	//   "@typescript-eslint/explicit-member-accessibility": 0,
	//   "@typescript-eslint/explicit-function-return-type": 0,
	//   "prettier/prettier": ["error", { "singleQuote": true }]
	// },
	// "overrides": [
	//   {
	//     // enable the rule specifically for TypeScript files
	//     "files": [".ts", ".tsx"],
	//     "rules": {
	//       "@typescript-eslint/explicit-member-accessibility": ["error"]
	//     }
	//   }
	// ]
}

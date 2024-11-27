const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const PAGES_DIR = path.join(__dirname, 'src', 'pages');

function getPages(dir = PAGES_DIR){
	let pages = [];

	fs.readdirSync(dir).forEach(file=>{
		const fullPath = path.join(dir,file);
		const relativePath = path.relative(PAGES_DIR,fullPath);

		if(fs.statSync(fullPath).isDirectory()){
			pages.push(relativePath);
			pages = pages.concat(getPages(fullPath));
		}
	});
	return pages;
}

const entry = {};
const htmlPlugins = [];

getPages().forEach(page=>{
	const scriptPath = path.join(PAGES_DIR, page, 'script.js');
	const stylePath = path.join(PAGES_DIR, page, 'style.css');
	//const globalJsPath = path.join(__dirname, 'src/global');

	entry[page] = [];

	//for(const file of fs.readdirSync(globalJsPath)){
	//	entry[page].push(path.join(globalJsPath, file));
	//}

	if(fs.existsSync(scriptPath)){
		entry[page].push(scriptPath);
	}

	if(fs.existsSync(stylePath)){
		entry[page].push(stylePath);
	}

	htmlPlugins.push(new HtmlWebpackPlugin({
		template: path.join(PAGES_DIR, page, 'index.html'),
		filename: `${page}/index.html`,
		chunks: fs.existsSync(scriptPath) ? [page] : [],
		meta:{
			'viewport': 'width=device-width, initial-scale=1',
			'darkreader-lock': '',
		}
	}));
});

//class PostBuildPlugin{
//	apply(compiler){
//		compiler.hooks.done.tap('PostBuildPlugin',(stats)=>{
//			genPetSim();
//		});
//	}
//}

//function genPetSim(){
//	if(fs.existsSync(path.join(__dirname,'src/artipetsim'))){
//		fs.cpSync(path.join(__dirname,'src/artipetsim/'),path.join(__dirname,'build/bin/artipetsim/'), {recursive:true});
//		fs.renameSync(path.join(__dirname,'build/bin/artipetsim/artipetsim.html'),path.join(__dirname,'build/bin/artipetsim/index.html'));
//	}
//}

module.exports = {
	mode: 'production',
	entry,
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: '[name]/bundle.[contenthash].js',
		publicPath: '/',
	},
	stats:{
		errorDetails: true,
		children:true,
	},
	module:{
		rules:[
			{
				test: /\/.(woff|woff2|eot|ttf|otf)$/,
				use:[
					{
						loader: 'file-loader',
						options: {
							name: '[path][name].[ext]',
							outputPath: 'assets/',
							// publicPath: '../assets"',
							limit: Infinity
						}
					}
				]
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: 'babel-loader',
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader,{
					loader: 'css-loader',
					options: {
						importLoaders: 1,
						url: true,
					},
				}],
			},
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				type: 'asset',
				use:[
					{
						loader: 'file-loader',
						options: {
							name: '[path][name].[ext]',
							outputPath: 'assets/',
						}
					}
				]
			},
		]
	},
	plugins:[
		new CleanWebpackPlugin(),
		new MiniCssExtractPlugin({
			filename: '[name]/style.[contenthash].css',
			chunkFilename: '[id].css',
		}),
		...htmlPlugins,
		//new PostBuildPlugin(),
	],
	optimization:{
		minimize:true,
		minimizer:[
			new TerserWebpackPlugin({
				extractComments: false,
				terserOptions: {
					compress:{
						drop_console: false,
					}
				}
			})
		]
	}
}

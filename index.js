const fs = require('fs');
const Spritesmith = require('spritesmith');
const chalk = require('chalk');
const path = require('path');
const mkdirp = require('mkdirp');
const template = require('art-template');


const log = console.log;
/*
    options
    必备参数 srcPath,outPath 分别为 icon 图的所在目录和输出目录 (绝对或相对路径)
    可选参数 type,pngname type:1 pc default type:2 mobile pngname合成的雪碧图 名称
    其他参数配置同 spritesmith

    图片格式为 常见的 4种 .png|.jpg|.jpeg|.gif

    example :
    options {
        srcPath : './icon',
        outPath : './dist',
        type : 1,
        pngname : 'sprites',

        padding : 20,
        algorithm : 'top-down',
        exportOtps : {
            quality: 75,
        }
        ...
    }
*/

function createSprite(options){
    let defaultopt = {
        type : 1,
        padding : 5,
        algorithm : 'top-down',
    };
    let opts = Object.assign(defaultopt,options);

    if(!opts.srcPath){
        log(chalk.red('options.srcPath 参数缺失：')+'icon 图片所在目录未配置');
        return;
    }
    opts.src = makeIconSrc(opts.srcPath);
    if(!opts.src || !opts.src.length) return;
    if(opts.algorithm != 'top-down' && opts.algorithm != 'left-right'){
        log(chalk.red('mobile 输出只支持 top-down 或 left-right'));
        return;
    }
    Spritesmith.run(opts,function(err,result){
        if(err){
            throw(err);
        }
        opts.pngname = opts.pngname || 'sprite';
        mkdirp.sync(path.join(__dirname,opts.outPath));
        fs.writeFileSync(path.join(__dirname,opts.outPath)+'/'+opts.pngname+'.png',result.image);
        // result.coordinates; result.properties;
        makeOutputFile(opts,result);

        log(chalk.green('创建成功!'));
        log(chalk.green('图片路径：')+path.join(__dirname,opts.outPath)+'/'+opts.pngname+'.png');

    });
}

function makeOutputFile(opts,result){
    var data = {}, reg = /\/([a-zA-Z0-9_-]+)\.(?:png|jpg|gif|jpeg)$/i;
    data.width = result.properties.width;
    data.height = result.properties.height;
    data.pngname = opts.pngname;
    data.items = [];
    data.type = opts.type;
    data.algorithm = opts.algorithm;

    for(var key in result.coordinates){
        var json = {};
        json.name = key.match(reg)[1];
        //json.value = JSON.stringify(result.coordinates[key]);
        json.value = result.coordinates[key];
        data.items.push(json);
    }

    //CSS SASS SCSS JSON LESS
    if(opts.type == 2){ // mobile
        var css = template(__dirname+'/template/mobileTpl.css',data);
        var scss = template(__dirname+'/template/mobileTpl.scss',data);
        fs.writeFileSync(path.join(__dirname,opts.outPath)+'/style.css',css);
        fs.writeFileSync(path.join(__dirname,opts.outPath)+'/style.scss',scss);
    }else{ // pc
        var css = template(__dirname+'/template/template.css',data);
        var scss = template(__dirname+'/template/template.scss',data);
        fs.writeFileSync(path.join(__dirname,opts.outPath)+'/style.css',css);
        fs.writeFileSync(path.join(__dirname,opts.outPath)+'/style.scss',scss);
    }
}


function makeIconSrc(iconPath){
    // log(path.join(__dirname+'/test/'+iconPath));
    iconPath = path.join(__dirname,iconPath);
    if(!fs.existsSync(iconPath)){
        log(chalk.red('目录不存在'));
        return;
    }
    let files = fs.readdirSync(iconPath);
    let result = [];
    files.forEach(function(name){
        if(checkImg(name)){
            log(name);
            result.push(path.join(iconPath,name));
        }
    });
    return result;
}

function checkImg(name){
    let reg = /.png|.jpg|.jpeg|.gif$/;
    return reg.test(name);
}


module.exports = {
    create : createSprite
}

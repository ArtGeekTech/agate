#!/usr/bin/env node
var program = require('commander');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp')
var color = require('cli-color')
var rootPath = __dirname.split(path.sep).slice(0, -1).join(path.sep)
program
        .version(JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')).version)


//<xxx>表示这是一个必填参数
//[xxx]表示这是一个可选参数
//[xxx...]表示这是一个可选数组参数
program
        .command('scaffold <rule> <controller> [actions...]')
        .description('创建一个路由规则, 控制器(controller.js), action方法及页面')
        .action(function (rule, controller, actions) {
            //agate scaffold /test2 test2  get#index post#create
            //相当于agate scaffold /test2 test2  index post#create
            var jsonPath = path.join(rootPath, 'config', 'routes.json')
            var json = require(jsonPath)
            var hasNewKey = false
            var newActions = []
            for (var i = 0, action; action = actions[i++]; ) {
                var arr = action.split("#")
                if (arr.length === 1) {
                    arr = ["get", action]
                } else {
                    arr = [arr[0].toLowerCase(), arr[1]]
                }
                var key = arr[0] + " " + rule
                var val = controller + " " + arr[1]
                if (json.hasOwnProperty(key)) {
                    console.error(key + " 已经定义")
                } else {
                    json[key] = val
                    newActions.push(arr[1])
                    hasNewKey = true
                }
            }
            if (hasNewKey) {
                var ret = {}
                //对路由规则进行排序，方便查工
                Object.keys(json).sort().forEach(function (el) {
                    ret[el] = json[el]
                })
                //重写routes.json的内容
                fs.writeFile(jsonPath, JSON.stringify(ret, null, '\t'), function (err) {
                    if (err)
                        throw err
                    console.log('添加新的路由规则成功')
                    console.log(JSON.stringify(ret, null, '\t'))
                })
                //准备要添加action函数
                var scontroller = newActions.map(function (action) {
                    return '\r\nexports.' + action + ' = function *(next) {\r\n' +
                            '\tyield this.render("' + controller + '/' + action + '")\r\n' +
                            '}\r\n'
                }).join("")
                var controllerPath = path.join(rootPath, "app", "pages", controller, "controller.js")
                //确保此目录存在
                mkdirp(path.dirname(controllerPath), function (err) {
                    //在controller.js中添加新action函数
                    fs.writeFile(controllerPath,
                            scontroller, {
                                encoding: "utf8",
                                flag: "a+"
                            },
                    function (err) {
                        if (err)
                            throw err
                        console.log('添加新action成功')
                    })
                    //添加action对应的空页面
                    newActions.forEach(function (action) {
                        fs.writeFile(path.join(rootPath, "app", "pages", controller, action + ".html"),
                                "", {
                                    encoding: "utf8",
                                    flag: "a+"
                                },
                        function () {
                        })
                    })

                })


            }

        }).on('--help', function () {
    console.log('参数:');
    console.log();
    console.log('%s\t  后跟路由规则，如%s，它会添加在config/routes.json下', color.bold('rule'), color.cyan('page\\:pageId'));
    console.log('%s后跟控制器的名字，不能有非法字符, 如topic', color.bold('controller'))
    console.log('它会在app/pages目录下建topic目录，再建一个controller.js');
    console.log('%s\t  后面重复跟N个%s ，如%s', color.bold('actions'), color.green('请求名#action名'),
            color.cyan('get#index get#about post#create'));
    console.log('此外get请求名默认可省略，相当于%s 有多少action就会建多少个相名空页面', color.cyan('index about post#create'));
    console.log('一个完整的命令如下');
    console.log(color.cyan('agate scaffold page\\:pageId topic index about post#create'));
    console.log();
});

program
        .command('start [port]')
        .description('输入一个端口号(没有默认为3000), 通过chrome打开该面')
        .action(function (port) {
             port = isFinite(port) ? 3000  : parseInit(port)
             
        })

program.parse(process.argv)


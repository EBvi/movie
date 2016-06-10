var app = Application.currentApplication();
app.includeStandardAdditions = true;

var source = app.doShellScript('curl http://movie.daum.net/premovie/released'),
// var source = app.doShellScript('cat ~/Desktop/test.txt'), // TEST
    html = sourceTrim(source),
    tmpdir = app.doShellScript('echo $TMPDIR');

var paging = +((html.match(/<div class=\"inner_paging\">(.*?)<\/div>/)[0] || '')
    .match(/<a href=\"released\?opt=total&page=([\d]*)/g) || ['']).reverse()[0]
    .replace('<a href="released?opt=total&page=', '') || 1;

function sourceTrim(v) {
    return v.split(/<!--.*?-->/).join('')
        .split(/[\r\t]/).join('')
        .split('    ').join('');
}

function makeArr(html) {
    var arr=[], ul = html.match(/<ul class=\"list_boxthumb\">(.*?)<\/ul>/)[0],
        li = ul.match(/<li>(.*?)<\/li>/g).map(function(v){
            arr.push({
            img: v.match(/<img data-original=\"(.*?)\"/)[1],
            link: 'http://movie.daum.net'+v.match(/<strong class=\"tit_join\"><a href=\"(.*?)\"/)[1],
            title: v.match(/<strong class=\"tit_join\"><a(.*?)>(.*?)<\/a>/)[2],
            rank: v.match(/<em class=\"emph_grade\">(.*?)<\/em>/)[1],
            openDate: v.match(/<dt>개봉일<\/dt><dd>(.*?)<\/dd>/)[1]
        });
    });
    return arr;
}

function fetchImage(src) {
    var filename = ''+src.match(/[\w]*$/);
    filename &&
        (app.doShellScript('test -e '+tmpdir+filename+' && echo "true" || echo "false"') === 'false') &&
        app.doShellScript('curl '+src+' >> '+tmpdir + filename);
    return tmpdir + filename;
}

var arr = makeArr(html);
for(var i=2;i<=paging; i++) {
    arr = arr.concat( makeArr( sourceTrim( app.doShellScript('curl http://movie.daum.net/premovie/released?page='+i) ) ) );
}

var items = [];
arr.map(function(v){
    items.push({
        title: `${v.title} (${v.rank}/10)`,
        subtitle: `${v.openDate}`,
        icon: {path:`${fetchImage(v.img)}`},
        arg: `${v.link}`
    });
});
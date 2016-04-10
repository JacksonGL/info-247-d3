
fs = require('fs')
fs.readFile('timesData.csv', 'utf8', function (err,data) {
  var rows = data.split('\n')
  for (var i=1;i<rows.length;i++) {
      rows[i] = rows[i].split(',');
      rows[i][13] = get_female_ratio(rows[i][13]);
      rows[i] = rows[i].join(',');
  }
  fs.writeFileSync('timesData_post.csv', rows.join('\n'));
});

function trim_str (str) {
        if (typeof str === 'string') {
            str = str.replace(/^[\s]+/g, '');
            str = str.replace(/[\s]+$/g, '');
        }
        return str
    }

function get_female_ratio(data) {
    if (typeof data === 'string') {
        data = trim_str(data);
        if (data === '') {
            data = '0.5'
        } else if (data.indexOf(':') < 0) {
            // then data is a floating point
            // number string e.g., '0.51'
            // do nothing
        } else {
            var first_col_pos = data.indexOf(':');
            var second_col_pos = data.indexOf(':', first_col_pos + 1);
            if (second_col_pos < 0) {
                second_col_pos = data.length;
            }
            var numerator = data.substring(0, first_col_pos);
            var denominator = data.substring(first_col_pos + 1, second_col_pos);
            var ratio = parseInt(numerator) / (parseInt(numerator) + parseInt(denominator));
            data = '' + ratio;
        }
    }
    return data;
}
function since(now,week,startDay){var d=new Date(now);d.setHours(0,0,0,0);if(week)d.setDate(d.getDate()-(d.getDay()-(startDay===undefined?1:startDay)+7)%7);return Math.floor(d.getTime()/1000);}
function countStats(text){var files=0,added=0,removed=0;text.split('\n').forEach(function(l){var m=l.match(/^(\d+|-)\t(\d+|-)\t/);if(m){files++;added+=Number(m[1])||0;removed+=Number(m[2])||0;}});return {files:files,added:added,removed:removed};}
if(typeof module!=='undefined')module.exports={since,countStats};


const printLog = function(content){
    console.log(`${timeString()} --: ${content}`);
}

const timeString = function(){
    let date = new Date();
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()} `;
}

module.exports = {
    printLog
};
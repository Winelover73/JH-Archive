module.exports = function (keyword) {   //合言葉の照合
    let result = false;
    if(keyword === "kwdlab") result = true;
    if(result === false) throw new Error('正しい合言葉を入力してください');
}

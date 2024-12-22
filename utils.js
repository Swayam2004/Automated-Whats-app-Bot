const hidePrivateData = (data) => 
    JSON.parse(
        JSON.stringify(data).replace(/"d{10}/g, (m) => '"${m.slice(1, 3)}xxxxxx')
    );

module.exports = { hidePrivateData };


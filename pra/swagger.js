const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");


const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Calculator API",
            version: "1.0.0",
            description: "간단한 사칙연산을 처리하는 API입니다.",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["*.js"]
};


const specs = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    specs
};

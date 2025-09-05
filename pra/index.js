const express = require("express"); // http 모듈 대신 사용, http 모듈보다 훨씬 간편함
const mysql = require("mysql2"); // 데이터베이스 활용을 위한 모듈
const cors = require("cors"); // cors 문제 해결

const { swaggerUi, specs } = require('./swagger'); //swagger

const app = express();
const port = 3000;

const pool = mysql.createPool({ //sql 데이터베이스를 처리할 객체를 생성
    host: 'localhost',          // createConnection 을 사용하면 요청 들어올때 마다 재접속
    user: 'devuser',            // createPool은 처리 객체 여러개가 대기하면서 요청을 처리 후 다시 대기
    password: 'tpdnjs0216',
    database: 'nums_db',
    charset: 'utf8mb4'
}).promise(); //async와 await 활용하기 위한 문법 

app.use(express.json()); //클라이언트가 보낸 json을 서버가 쓸 수 있게 자바스크립트 객체로 바꿔주는 미들웨어
app.use(cors());         // 없으면 req.body 해도 못 읽음
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs)); // swagger ui

app.get('/favicon.ico', (req, res) => { res.status(204); }); // 인터넷 아이콘 설정

app.get('/', (req, res) => {
    res.send("시작화면");
})

/**
 * @swagger
 * /nums:
 *   get:
 *     summary: "전체 숫자 데이터 조회"
 *     description: "데이터베이스에 저장된 모든 숫자 계산 결과를 조회합니다."
 *     tags: [Nums]
 *     responses:
 *       200:
 *         description: "성공적으로 조회됨"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   first_num:
 *                     type: integer
 *                   operator:
 *                     type: string
 *                   last_num:
 *                     type: integer
 *                   result:
 *                     type: integer
 *       500:
 *         description: "서버 오류 발생"
 */
app.get('/nums', async (req, res) => { // await 사용가능 함수
    try {                              // 데이터베이스 고유 형식을 자바스크립트 객체로 변환
        const [rows] = await pool.query("SELECT * FROM nums"); // pool.query가 반환 한 값 중 [ [데이터 묶음] , [부가 정보] , ... ]
        res.json(rows);                                        // 첫번째 [] 값만 사용 , 활용하면 [ , rows] , [rows, fields]
    } catch (error) {                                          // 배열 구조 분해 할당 이라 부름 (순서)
        console.error("DB 조회 오류 발생", error); // console.error가 에러 내용을 파악하기 더 좋음
        res.status(500).send("서버 오류발생");
    } // try - catch를 통해 오류가 나도 catch로 넘어가서 오류를 처리하기 때문에, 갑작스러운 서버 다운 방지
})

/**
 * @swagger
 * /nums/{id}:
 *   get:
 *     summary: "특정 ID의 데이터 조회"
 *     description: "ID를 사용해 특정 숫자 계산 결과를 조회합니다."
 *     tags: [Nums/Id]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "조회할 데이터의 ID"
 *     responses:
 *       200:
 *         description: "성공적으로 조회됨"
 *       404:
 *         description: "해당 ID를 찾을 수 없음"
 *       500:
 *         description: "서버 오류 발생"
 */
app.get('/nums/:id', async (req, res) => {
    const id = parseInt(req.params.id); // 파라미터 통해서 값 받아옴
    try {                               // sql injection 이란 해킹 방어 ㅡ url에 sql 명령어를 주입해 데이터베이스 공격 ?로 하면 순수 값으로 해석
        const [rows] = await pool.query("SELECT * FROM nums WHERE id = ?", [id]);
        if (rows.length === 0) {
            console.log("해당 ID 없음");
            res.status(404).send("해당 ID 없음");
        } else {
            res.status(200).json(rows[0]); //자바객체를 json 형태로 보냄
        }
    } catch (error) {
        console.error("DB 조회 오류 발생", error);
        res.status(500).send("서버 오류발생");
    }
})

/**
 * @swagger
 * /nums:
 *   post:
 *     summary: "새로운 계산 데이터 추가"
 *     description: "새로운 숫자 계산 결과를 데이터베이스에 추가합니다."
 *     tags: [Nums]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_num:
 *                 type: integer
 *               operator:
 *                 type: string
 *                 example: "+"
 *               last_num:
 *                 type: integer
 *     responses:
 *       201:
 *         description: "성공적으로 생성됨"
 *       400:
 *         description: "잘못된 입력값"
 *       500:
 *         description: "서버 오류 발생"
 */
app.post('/nums', async (req, res) => {
    try {
        const { first_num, last_num, operator } = req.body; //객체 구조 분해 할당 (key 값)

        const isNumeric = /^[0-9]+$/;
        //정규표현식 문자열 검사
        // req.body에서 받은 값은 문자열일 수 있으므로, 바로 정규식으로 검사합니다.
        if (!isNumeric.test(first_num) || !isNumeric.test(last_num)) { 
            return res.status(400).send("입력값은 반드시 숫자여야 합니다.");
        } // 프론트엔드에서 한번 더 검사하면 좋음.

        const f_num = parseInt(first_num);
        const l_num = parseInt(last_num);

        let result;

        switch (operator) {
            case '+':
                result = f_num + l_num;
                break;

            case '-':
                result = f_num - l_num;
                break;

            case '*':
                result = f_num * l_num;
                break;

            case '/':
                if (l_num === 0) {
                    return res.status(400).send("0으로 나눌 수 없습니다.");
                }
                result = Math.floor(f_num / l_num);
                break;

            default:
                return res.status(400).send("알 수 없는 연산자");
        }

        const [newdata] = await pool.query("INSERT INTO nums (first_num,operator,last_num,result) VALUES (?,?,?,?)", [f_num, operator, l_num, result]);
        const [postdata] = await pool.query("SELECT * FROM nums WHERE id = ?", [newdata.insertId]);
        res.status(201).json(postdata[0]);
    } catch (error) {
        console.error("DB 조회 오류 발생", error);
        res.status(500).send("서버 오류발생");
    }
})

/**
 * @swagger
 * /nums/{id}:
 *   put:
 *     summary: "계산 데이터 변경"
 *     description: "기존 숫자 계산 결과를 데이터베이스에서 완전변경합니다."
 *     tags: [Nums/Id]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "수정할 데이터의 ID"
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_num:
 *                 type: integer
 *               operator:
 *                 type: string
 *                 example: "+"
 *               last_num:
 *                 type: integer
 *     responses:
 *       200:
 *         description: "성공적으로 변경됨"
 *       400:
 *         description: "잘못된 입력값"
 *       404:
 *         description: "값이 존재하지 않음"
 *       500:
 *         description: "서버 오류 발생"
 */
app.put('/nums/:id', async(req, res) => { // 전체 수정을 원칙으로, 모든 데이터 값을 넘겨야함. 멱등성 존재해야함.
    const idToUpdate = parseInt(req.params.id);
    try {
        const { first_num, operator ,last_num} = req.body;

        if (first_num === undefined || last_num === undefined || operator === undefined) {return res.status(404).send("값을 모두 입력해주세요")}

        const isNumeric = /^[0-9]+$/;
        if (!isNumeric.test(first_num) || !isNumeric.test(last_num)) {
            return res.status(400).send("입력값은 반드시 숫자여야 합니다.");
        } 
        const f_num = parseInt(first_num);
        const l_num = parseInt(last_num);

        let result;

        switch (operator) {
            case '+':
                result = f_num + l_num;
                break;

            case '-':
                result = f_num - l_num;
                break;

            case '*':
                result = f_num * l_num;
                break;

            case '/':
                if (l_num === 0) {
                    return res.status(400).send("0으로 나눌 수 없습니다.");
                }
                result = Math.floor(f_num / l_num);
                break;

            default:
                return res.status(400).send("알 수 없는 연산자");
        }
        const [update] = await pool.query("UPDATE nums SET first_num = ?, operator = ?, last_num = ? , result = ? WHERE id = ?",[first_num,operator,last_num,result,idToUpdate])
        if (update.affectedRows === 0) {
            console.log("해당 ID 없음")
            res.status(404).send("해당 ID 없음")
        } else {
        const [putdata] = await pool.query("SELECT * FROM nums WHERE id = ?",[idToUpdate])
        res.status(200).json(putdata[0])
        }
    } catch (error) {
        console.log("DB 조회 오류 발생")
        res.status(500).send("서버 오류발생")
    }
})

/**
 * @swagger
 * /nums/{id}:
 *   patch:
 *     summary: "계산 데이터 변경"
 *     description: "기존 숫자 계산 결과를 데이터베이스에서 부분변경합니다."
 *     tags: [Nums/Id]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "수정할 데이터의 ID"
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_num:
 *                 type: integer
 *               operator:
 *                 type: string
 *                 example: "+"
 *               last_num:
 *                 type: integer
 *     responses:
 *       200:
 *         description: "성공적으로 변경됨"
 *       400:
 *         description: "잘못된 입력값"
 *       404:
 *         description: "값이 존재하지 않음"
 *       500:
 *         description: "서버 오류 발생"
 */
app.patch('/nums/:id', async(req, res) => { //멱등성 보장 x , 일부 값 수정
    
    try {
        const idToUpdate = parseInt(req.params.id);
        const [rows] = await pool.query("SELECT * FROM nums WHERE id = ?",[idToUpdate])
        
        if (rows.length === 0) { return res.status(404).send("해당 ID 없음");}
        const update_data = {...rows[0], ...req.body};
        
        const { first_num, operator ,last_num} = update_data;

        const isNumeric = /^[0-9]+$/;
        if (!isNumeric.test(first_num) || !isNumeric.test(last_num)) {
            return res.status(400).send("입력값은 반드시 숫자여야 합니다.");
        }

        const f_num = parseInt(first_num);
        const l_num = parseInt(last_num);

        let result;

        switch (operator) {
            case '+':
                result = f_num + l_num;
                break;

            case '-':
                result = f_num - l_num;
                break;

            case '*':
                result = f_num * l_num;
                break;

            case '/':
                if (l_num === 0) {
                    return res.status(400).send("0으로 나눌 수 없습니다.");
                }
                result = Math.floor(f_num / l_num);
                break;

            default:
                return res.status(400).send("알 수 없는 연산자");
        }

        await pool.query("UPDATE nums SET first_num = ?, operator = ?, last_num = ? , result = ? WHERE id = ?",[first_num,operator,last_num,result,idToUpdate])
        
        const [patchdata] = await pool.query("SELECT * FROM nums WHERE id = ?",[idToUpdate])
        res.status(200).json(patchdata[0])
        
    } catch (error) {
        console.log("DB 조회 오류 발생")
        res.status(500).send("서버 오류발생")
    }
})

/**
 * @swagger
 * /nums/{id}:
 *   delete:
 *     summary: "계산 데이터 제거"
 *     description: "기존 숫자 계산 결과를 데이터베이스에서 제거합니다."
 *     tags: [Nums/Id]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "삭제할 데이터의 ID"
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: "성공적으로 제거됨"
 *       404:
 *         description: "해당 ID 없음"
 *       500:
 *         description: "서버 오류 발생"
 */
app.delete('/nums/:id', async (req, res) => {
    const idToDelete = parseInt(req.params.id); 
    if (isNaN(idToDelete)) {return res.status(400).send("ID를 입력해주세")}

    try {
        const [result] = await pool.query("DELETE FROM nums WHERE id = ?", [idToDelete])
        if (result.affectedRows === 0) {
            console.log("해당 ID 없음");
            res.status(404).send("해당 ID 없음");
        } else {
            res.status(204).send();
        }
    } catch (error) {
        console.error("DB 조회 오류 발생", error);
        res.status(500).send("서버 오류발생");
    }
})



app.listen(port, () => {
    console.log(`서버 주소 : http://localhost:${port}`);
    console.log(`Swagger 주소 : http://localhost:${port}/api-docs`);
})
import React, { useState, useEffect } from 'react'; // React는 import하지 않아도, Babel이 알아서 처리해줌.
import './App.css';                                 // 기존 문법에서는 Babel이 해석한 JSX에 React가 있어서 import 해야했는데 최신 문법에서 자동으로 바뀜

function App() { //각 값을 담고 State따라 값을 바꾸는 코드
  const [view, setView] = useState("home"); //기본 값 담기
  const [items, setItems] = useState([]);
  const [firstnum, setFirstNum] = useState();
  const [lastnum, setLastNum] = useState();
  const [id, setId] = useState('');
  const [result, setResult] = useState(null);
  const [operator, setOperator] = useState('+');

  const handlePost = async () => { //function handlePost() { ... } 랑 같은데, 최신 문법 따른것임.
    const caldata = { //입력된 값으로 javascript 객체 만들기
      first_num: firstnum,
      last_num: lastnum,
      operator: operator
    };

    try { // fetch 서버에 파일 요청 보내는 메서드
      const response = await fetch('http://localhost:3000/nums', {
        method: 'POST', // 요청과 함께 정보도 담아보내야함.
        headers: {
          'Content-Type': 'application/json', //json 형태라고 명시
        },
        body: JSON.stringify(caldata), //json으로 객체 변환하기

      });
      const resultnum = await response.json();
      setResult(resultnum.result)
      alert("데이터 추가 성공")
    } catch (error) {
      alert("데이터 추가 실패 다시 시도해주세요")
      console.error("데이터 추가 중 에러", error);
    }
  };

  const handleDelete = async () => {
    // 백엔드에서 구현될 수 없는 부분, id가 있어야 del로 넘어갈 수 있음. 오류가 안나게 막
    try {
      await fetch(`http://localhost:3000/nums/${id}`, { method: 'DELETE' });

      //    .filter()를 사용해 조건에 통과한 객체만 받아옴
      setItems(items.filter(item => item.id !== parseInt(id)));

      // 입력창을 비우기.
      setId('');
      alert("해당 데이터 삭제 성공")
    } catch (error) {
      alert("데이터 삭제처리 실패 다시 시도해주세요")
      console.error("삭제 중 에러:", error);
    }
  };

  const handlePut = async () => {
    if (!id) return;
    try {
      const updatedata = {
        first_num: firstnum,
        last_num: lastnum,
        operator: operator
      }
      const response = await fetch(`http://localhost:3000/nums/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedata),
      });

      const putdata = await response.json();
      setItems(items.map(item => item.id === parseInt(id) ? putdata : item))
      alert("데이터 변경 성공")
    } catch (error) {
      alert("데이터 변경 실패 다시 시도해주세요")
      console.error("업데이트 중 에러", error)
    }
  }
  const handlePatch = async () => {
    if (!id) return;

    try {
      const updateData = {};
      if (firstnum) updateData.first_num = firstnum;
      if (lastnum) updateData.last_num = lastnum;
      if (operator) updateData.operator = operator;

      const response = await fetch(`http://localhost:3000/nums/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const putdata = await response.json();
      setItems(items.map(item => item.id === parseInt(id) ? putdata : item))
      alert("데이터 변경 성공")
    } catch (error) {
    alert("데이터 변경 실패 다시 시도해주세요")
    console.error("업데이트 중 에러", error)
  }

  setItems(items.map(item => item.id === parseInt(id)));

}

// react 기능임
//기본적으로 화면이 새로 그려질 때 마다 실행됨. firstnum의 글자 하나하나에 실행 비효율적
useEffect(() => {
  if (view !== "home") {
    fetch('http://localhost:3000/nums') //method 지정 없으면 자동으로 GET
      .then(res => res.json()) //.then 다음에 실행할 함수 예약, 작업이 끝나면 다음 단계로 넘어감
      .then(data => setItems(data)) //각각 전 함수의 리턴값을 인자로 받음
      .catch(err => console.error(err)); //실패시의 리턴값을 인자로 받음 함수 실행 순서 상관 없이 바로 에러 받음
  }
}, [view]); //'의존성 배열' 오직 view값이 바뀔때만 실행되라는 조건
//빈 배열은 화면 시작시 한번만을 의미, 여러 값이 배열에 들어갈 수 있음


//아래부터 나오는 onClick등은 react 환경의 기본 속성값임.
if (view === "home") {
  return (
    <div className="App">
      <h1><strong>🧮사칙연산🧮</strong></h1>
      <h2>초기화면!</h2>
      <button onClick={() => setView("calculate")}>
        연산하기
      </button>
      <button onClick={() => setView("list")}>
        계산 목록 조회하기
      </button>
      <button onClick={() => setView("update")}>
        계산 항목 변경하기
      </button>
      <button onClick={() => setView("delete")}>
        계산 항목 삭제하기
      </button>
    </div>
  );
}
else if (view === "calculate") {
  return (
    <div className="App">
      <h1>연산하기</h1>
      <input
        size='13'
        type='text'
        placeholder='숫자를 입력해주세요'
        onChange={e => setFirstNum(e.target.value)}
      />
      <select onChange={(e) => setOperator(e.target.value)}>
        <option value="+">더하기</option>
        <option value="-">빼기</option>
        <option value="*">곱하기</option>
        <option value="/">나누기</option>
      </select>
      <input
        size='13'
        type='text'
        placeholder='숫자를 입력해주세요'
        onChange={e => setLastNum(e.target.value)}
      /><br />
      <button onClick={handlePost}>연산하기</button>

      {result !== null && (
        <div className="result-box">
          <h2>계산 결과: {result}</h2>
        </div>
      )}

      <button onClick={() => {
        setView('home');
        setResult(null);
        setFirstNum();
        setLastNum();
        setOperator('+');
      }}>홈으로</button>
    </div>
  );
}

else if (view === "list") {
  return (
    <div className="App">
      <h1><strong>계산목록</strong></h1>
      <ul> {/* map : 요소 안 객체들에게 ()작업을 똑같이 적용 */}
        {items.map(c => (
          <li key={c.id}>
            {c.first_num} {c.operator} {c.last_num} = {c.result}
          </li>
        ))}
      </ul>
      <button onClick={() => setView("home")}>홈으로</button>
    </div>
  );
}
else if (view === "update") {
  return (
    <div className="App">
      <h1><strong>계산 항목 변경하기</strong></h1>
      <input
        size='27'
        type='text'
        placeholder='변경하고 싶은 항목의 ID를 알려주세요'
        onChange={e => setId(e.target.value)}
      /> <br />
      <input
        size='13'
        type='text'
        placeholder='숫자를 입력해주세요'
        onChange={e => setFirstNum(e.target.value)}
      />
      <select onChange={(e) => setOperator(e.target.value)}>
        <option value="+">더하기</option>
        <option value="-">빼기</option>
        <option value="*">곱하기</option>
        <option value="/">나누기</option>
      </select>
      <input
        size='13'
        type='text'
        placeholder='숫자를 입력해주세요'
        onChange={e => setLastNum(e.target.value)}
      /> <br />

      {/* html 내에서는 {}로 감싸야 jsx 문법이 작동 */}
      {/* 함수 뒤에 () 유무에 따라 즉시 실행과 ui에 의한 실행이 나뉨 규칙 */}
      <button onClick={() => handlePut(id)}>전체 변경하기</button>
      <button onClick={() => handlePatch(id)}>부분 변경하기</button>

      <ul>
        {items.map(i => (
          <li key={i.id}>
            [ID : {i.id}] {i.first_num} {i.operator} {i.last_num} = {i.result}
          </li>
        ))}
      </ul>
      <button onClick={() => { setView("home"); setId(''); setResult(null); }}>홈으로</button>
    </div>
  );
}
else if (view === "delete") {
  return (
    <div className="App">
      <h1><strong>계산 항목 지우기</strong></h1>
      <input
        size='27'
        type='text'
        placeholder='지우고 싶은 항목의 ID를 알려주세요'
        onChange={e => setId(e.target.value)}
      />     {/* 함수 뒤에 () 유무에 따라 즉시 실행과 ui에 의한 실행이 나뉨 규칙 */}
      <button onClick={handleDelete}>지우기</button>
      <ul>
        {items.map(i => (
          <li key={i.id} >
            [ID:{i.id}] {i.first_num} {i.operator} {i.last_num} = {i.result}
          </li>
        ))}
      </ul>
      <button onClick={() => { setView("home"); setId(''); }}>홈으로</button>
    </div>
  );
}
}

export default App; //App 함수 내보내기 default는 import 해올때 제약이 없도록 함
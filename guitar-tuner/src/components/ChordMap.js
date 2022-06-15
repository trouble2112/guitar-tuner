import { NoteFrequencies } from "../constants/guitarNote";

import styled from "styled-components";

const NoteContainer = styled.div`
  position: relative;
  border: 1px solid red;
`;

const NoteElement = styled.td`
  text-align: center;
  background-color: green;
  :hover {
    background-color: greenyellow;
  }
`;

function Note({ index, values }) {
  const handleClick = (e, data) => {
    console.log(data);
  };
  return (
    <tr>
      <td key={index}>{13 - index}</td>
      {values.map((v, i) => (
        <NoteElement
          value={v.value}
          name={6 - i}
          onClick={(e) => handleClick(e, { frequency: v.value, index: 6 - i })}
          key={`${index}-${i}`}
        >
          {v.name}
        </NoteElement>
      ))}
    </tr>
  );
}

export default function ChordMap() {
  const getStringArray = (name) => {
    const index = NoteFrequencies.findIndex((p) => p.name === name);
    return NoteFrequencies.slice(index - 13, index + 8).map((v) => {
      return { ...v, name: v.name.replace(/\d+/g, "") };
    });
  };
  const S6 = getStringArray("E2");
  const S5 = getStringArray("A2");
  const S4 = getStringArray("D3");
  const S3 = getStringArray("G3");
  const S2 = getStringArray("B3");
  const S1 = getStringArray("E4");
  const strings = [S6, S5, S4, S3, S2, S1];
  const data = S6.map((_, i) => strings.map((r) => r[i]));

  return (
    <NoteContainer className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>6th</th>
            <th>5th</th>
            <th>4th</th>
            <th>3th</th>
            <th>2th</th>
            <th>1th</th>
          </tr>
        </thead>
        <tbody>
          {data.map((v, i) => (
            <Note index={i} values={v} key={`note-${i}`} />
          ))}
        </tbody>
      </table>
    </NoteContainer>
  );
}

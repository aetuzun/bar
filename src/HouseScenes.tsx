type Scene = "shake" | "toast" | "flowers";

export function HouseScene({ scene }: { scene: Scene }) {
  const girl = scene === "flowers", shaker = scene === "shake";
  const skin = "#d4a586", hair = "#795746", paper = "#f3e9cc";
  return (
    <svg className={"house-scene " + scene} viewBox="0 0 56 64" shapeRendering="crispEdges" aria-hidden="true">
      <g className="figure">
        <path fill={hair} d="M17 9h4V6h11v3h4v17h-5v4H17z" />
        {shaker && <path fill={hair} d="M11 10h7v10h-8v-7h1z" />}
        {girl && <path fill={hair} d="M12 13h6v14h-5v-5h-3v-6h2zm21 0h6v6h2v5h-4v4h-4z" />}
        <path fill={skin} d="M19 13h10v-3h3v6h3v6h-3v4h-5v5h-7v-8h-3v-7h2z" />
        <path fill="#45372f" d="M29 15h2v2h-2z" />
        <path fill={girl ? "#c7aaa8" : shaker ? "#819c87" : "#899ca7"} d="M17 27h4l4 4 4-4h4v4h3v8h-4v13H15V39h-4v-7h3v-3h3z" />
        {shaker && <path fill={paper} d="M18 28h2v8h8v-8h2v10h1v14H17V38h1z" />}
        {girl && <path fill="#c7aaa8" d="M17 44h14v5h3v6H13v-6h4z" />}
        <path fill={girl ? skin : "#646c66"} d="M17 52h6v8h-6zm10 0h5v8h-5z" />
        <path fill={paper} d="M16 59h7v3h-9v-2h2zm11 0h6v1h3v2h-9z" />
        <g className="scene-arm">
          <path fill={skin} d="M30 32h5v4h4v-6h4v9h-3v2h-7v-3h-3z" />
          {shaker ? <g>
            <path fill="#aebbb4" d="M38 17h6v3h3v4h1v11h-9v-9h-2v-6h1z" />
            <path fill={paper} d="M39 16h5v3h-5zm0 5h7v2h-7zm1 5h2v6h-2z" />
          </g> : girl ? <g>
            <path fill="#91a978" d="M40 19h2v12h-2zm-4 5h4v3h-4zm6-2h4v3h-4z" />
            <path fill="#e3b9bc" d="M38 14h2v-3h3v3h3v4h-3v3h-4v-3h-3v-3h2z" />
            <path fill="#ecd589" d="M40 15h3v3h-3z" />
          </g> : <g>
            <path fill={paper} d="M36 18h11v7h-2v3h-3v5h4v2h-10v-2h4v-5h-2v-3h-2z" />
            <path fill="#cd995a" d="M38 22h7v3h-2v2h-3v-2h-2z" />
          </g>}
        </g>
        <path fill={skin} d="M11 38h5v9h-2v3h-4v-9h1z" />
      </g>
      {girl && <g><path fill="#849d78" d="M44 41h2v9h-2zm3-7h2v15h-2z"/><path fill="#e7c879" d="M43 37h4v5h-5v-3h1z"/><path fill="#dbb3ba" d="M46 31h4v4h-5v-3h1z"/><path fill="#a8bbbb" d="M41 48h10v3h-2v2h2v7h-2v2h-8v-2h-1v-7h2v-2h-1z"/></g>}
    </svg>
  );
}

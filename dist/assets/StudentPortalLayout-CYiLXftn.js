import{af as s,al as u,a as p,h as y,r as f,j as e,ay as b,L as g,B as j,O as N}from"./index-Cx8OUONG.js";import{B as d}from"./book-open-CFVsDfXA.js";/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"m9 16 2 2 4-4",key:"19s6y9"}]],k=s("calendar-check",v);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],M=s("layout-dashboard",w);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],L=s("log-out",_);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]],$=s("menu",S);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],O=s("x",C);function P(){var o;const{user:t,logout:c}=u(),i=p(),h=y(),[n,l]=f.useState(!1),x=()=>{c(),i("/student/login")},m=[{name:"Dashboard",path:"/student/dashboard",icon:M},{name:"Attendance",path:"/student/attendance",icon:k},{name:"Request",path:"/student/requests",icon:d},{name:"Profile",path:"/student/profile",icon:b}];return e.jsxs("div",{className:"min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900",children:[e.jsxs("div",{className:"md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30",children:[e.jsxs("div",{className:"flex items-center gap-2 font-bold text-xl text-blue-600",children:[e.jsx(d,{className:"w-6 h-6"}),e.jsx("span",{children:"Student Portal"})]}),e.jsx("button",{onClick:()=>l(!n),className:"p-2 text-gray-600",children:n?e.jsx(O,{}):e.jsx($,{})})]}),e.jsx("aside",{className:`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${n?"translate-x-0":"-translate-x-full"}
      `,children:e.jsxs("div",{className:"h-full flex flex-col",children:[e.jsxs("div",{className:"p-6 border-b border-gray-100 hidden md:flex items-center gap-2 font-bold text-xl text-blue-600",children:[e.jsx(d,{className:"w-6 h-6"}),e.jsx("span",{children:"Student Portal"})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto py-4",children:[e.jsx("div",{className:"px-4 mb-6",children:e.jsxs("div",{className:"bg-blue-50 p-4 rounded-lg flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg",children:((o=t==null?void 0:t.fullName)==null?void 0:o.charAt(0))||"S"}),e.jsxs("div",{className:"overflow-hidden",children:[e.jsx("p",{className:"font-medium text-sm truncate",title:t==null?void 0:t.fullName,children:t==null?void 0:t.fullName}),e.jsx("p",{className:"text-xs text-blue-500 truncate",title:t==null?void 0:t.email,children:t==null?void 0:t.email})]})]})}),e.jsx("nav",{className:"px-2 space-y-1",children:m.map(a=>{const r=h.pathname===a.path;return e.jsxs(g,{to:a.path,onClick:()=>l(!1),className:`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${r?"bg-blue-50 text-blue-600":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`,children:[e.jsx(a.icon,{className:`w-5 h-5 ${r?"text-blue-600":"text-gray-400"}`}),a.name]},a.path)})})]}),e.jsx("div",{className:"p-4 border-t border-gray-100",children:e.jsxs(j,{variant:"ghost",onClick:x,className:"w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700",children:[e.jsx(L,{className:"w-5 h-5 mr-3"}),"Logout"]})})]})}),e.jsx("main",{className:"flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-8",children:e.jsx("div",{className:"max-w-5xl mx-auto",children:e.jsx(N,{})})}),n&&e.jsx("div",{className:"fixed inset-0 bg-black/20 z-30 md:hidden",onClick:()=>l(!1)})]})}export{P as default};

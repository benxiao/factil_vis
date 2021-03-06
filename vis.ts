import * as d3 from "d3"
import {drag} from "d3-drag";

document.addEventListener("DOMContentLoaded", ready);
type Node = {name:string, type:string};
type Link = {source:string, target:string, type:string}
//type RoseTree = {name:string, id:number, children:[RoseTree]}




const width: number = 400;
const height: number = 480;

function ready():void {
    d3.json("data/factil.json", main)
}



// class RoseTree {
//     name: string;
//     _children:[RoseTree];
//     toggle:boolean;
//
//     constructor(name:string, children:[RoseTree]){
//         this.name = name;
//         this._children = children;
//         this.toggle = true;
//     }
//
//     add_child(ch:RoseTree){ this._children.push(ch); }
//
//     children():[RoseTree]{ return (this.toggle) ? this._children : []; }
//
//     find(name:string):RoseTree|null{
//         if (this.name == name) { return this}
//         for (let ch of this._children){
//             return ch.find(name);
//         }
//         return null;
//     }
//
//     toggle(name:string){
//         const node = this.find(name);
//         if (node != null){
//             node.toggle = !node.toggle;
//         }
//     }
// }
//
//
// function build_tree(links:[Link], root:RoseTree){
//     var q:[string] = [root.name];
//     while (q.length > 0) {
//
//     }
//
//
//
// }
//
// function get_tree(data:any):RoseTree {
//     const links = data.links;
//     const root_name = links[0].target;
//     const root = new RoseTree(root_name, []);
//
// }




// nodes: [
function get_nodes(data: any): [Node] {
    data.datastores.forEach((d:any)=>{d.topics.forEach((x:Link)=>{x.target=x.source+"."+x.target})});
    const models = data.datastores.map((d:any)=>{ return {name: d.name, type:"top"}});
    const topics = data.datastores
        .map((d:any)=> {return d.topics.map((x:any)=>{ return {name: x.target, type: x.type }})})
        .reduce((x:[Node], y:[Node])=>x.concat(y), []);
    return models.concat(topics);
}

function get_links(data:any): [Link] {
    const convert = (d:any)=>{return {source: d.source, target:d.target, type: d.type}};
    const model_links = data.links.map(convert);
    const topic_links = data.datastores
        .map((d: any) => {return d.topics})
        .reduce((x: [Link], y: [Link]) => x.concat(y), [])
        .map(convert);
    return model_links.concat(topic_links);
}

function main(error:any, data:any):void {
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const group = svg.append("g")
        .attr("class","everything");

    const nodes = get_nodes(data);
    console.log(nodes);

    const links = get_links(data);

    const simulation = d3.forceSimulation().nodes(nodes);

    const linkForce = d3.forceLink(links)
        .id((d:any)=>d.name);

    const chargeForce = d3.forceManyBody()
        .strength(-200);

    const centerForce = d3.forceCenter(width/2, height/2);
    simulation
        .force("charge_force", chargeForce)
        .force("center_force", centerForce)
        .force("links", linkForce);

    simulation.on("tick", tick);

    const linkColor = (d:any)=>(d.type=="dataflow") ? "red" : "green";

    const link = group.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", 1)
        .style("stroke", linkColor);


    const circleColor = (d:any)=>(d.type == "topic") ? "red" : "green";
    const circleRadius = (d:any)=>(d.type == "topic") ? 5 : 20;


    function dragStart(d:any){
        if(!d3.event.active) {simulation.alphaTarget(0.3).restart();}
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragDrag(d:any){
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragEnd(d:any){
        if(!d3.event.active) {
            simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    }

    const node = group.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", circleRadius)
        .attr("fill", circleColor);

    d3.selectAll("circle")
        .call(d3.drag()
            .on("start", dragStart)
            .on("drag", dragDrag)
            .on("end", dragEnd));


    function tick():void{
        link.attr("x1", (d:any)=>{return d.source.x})
            .attr("y1", (d:any)=>{return d.source.y})
            .attr("x2", (d:any)=>{return d.target.x})
            .attr("y2", (d:any)=>{return d.target.y});
        node.attr("cx", (d:any)=>{ return d.x})
            .attr("cy", (d:any)=>{return d.y})
    }


}



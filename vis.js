import * as d3 from "d3";
document.addEventListener("DOMContentLoaded", ready);
const width = 400;
const height = 480;
function ready() {
    d3.json("data/factil.json", main);
}
function get_nodes(data) {
    data.datastores.forEach((d) => { d.topics.forEach((x) => { x.target = x.source + "." + x.target; }); });
    const models = data.datastores.map((d) => { return { name: d.name, type: "top" }; });
    const topics = data.datastores
        .map((d) => { return d.topics.map((x) => { return { name: x.target, type: x.type }; }); })
        .reduce((x, y) => x.concat(y), []);
    return models.concat(topics);
}
function get_links(data) {
    const convert = (d) => { return { source: d.source, target: d.target, type: d.type }; };
    const model_links = data.links.map(convert);
    const topic_links = data.datastores
        .map((d) => { return d.topics; })
        .reduce((x, y) => x.concat(y), [])
        .map(convert);
    return model_links.concat(topic_links);
}
function main(error, data) {
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    const group = svg.append("g")
        .attr("class", "everything");
    const nodes = get_nodes(data);
    console.log(nodes);
    const links = get_links(data);
    const simulation = d3.forceSimulation().nodes(nodes);
    const linkForce = d3.forceLink(links)
        .id((d) => d.name);
    const chargeForce = d3.forceManyBody()
        .strength(-200);
    const centerForce = d3.forceCenter(width / 2, height / 2);
    simulation
        .force("charge_force", chargeForce)
        .force("center_force", centerForce)
        .force("links", linkForce);
    simulation.on("tick", tick);
    const linkColor = (d) => (d.type == "dataflow") ? "red" : "green";
    const link = group.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", 1)
        .style("stroke", linkColor);
    const circleColor = (d) => (d.type == "topic") ? "red" : "green";
    const circleRadius = (d) => (d.type == "topic") ? 5 : 20;
    function dragStart(d) {
        if (!d3.event.active) {
            simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragDrag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    function dragEnd(d) {
        if (!d3.event.active) {
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
    function tick() {
        link.attr("x1", (d) => { return d.source.x; })
            .attr("y1", (d) => { return d.source.y; })
            .attr("x2", (d) => { return d.target.x; })
            .attr("y2", (d) => { return d.target.y; });
        node.attr("cx", (d) => { return d.x; })
            .attr("cy", (d) => { return d.y; });
    }
}
//# sourceMappingURL=vis.js.map
import {makeAutoObservable, runInAction} from "mobx";
import {http} from "../utils/http";
import {message} from "antd";

// 节点表与边表数据结构
class GraphData {

    graphInfo = {
        directed: false,
        connected: false,
        nodeCount: 0,
        edgeCount: 0,
        maxDegree: 0,
        averageDegree: 0,
        diameter: 0,
        averagePathLen: 0,
        globalClusteringCoefficient: 0,
        density: 0,
        degree: [],
    }

    nodes = {
        columns: [],
        data: []
    }
    edges = {
        columns: [],
        data: []
    }

}

class GraphStore {
    // 当前图的基本信息，记录了图的数量、图的名称、每个图的节点列名
    graphBaseInfo = {
        length: 0,
        graphNames: [],
        columnInfo: {
            __test: [],
        }
    }

    // 图详细信息映射，key为图名
    graphDataMap = new Map()

    dataTable = {
        nodes: {
            columns: [],
            data: []
        },
        edges: {
            columns: [],
            data: []
        }
    }
    // 当前的图信息
    graphInfo = {
        directed: false,
        connected: false,
        nodeCount: 0,
        edgeCount: 0,
        maxDegree: 0,
        averageDegree: 0,
        diameter: 0,
        averagePathLen: 0,
        globalClusteringCoefficient: 0,
        density: 0,
        degree: [],
    }


    constructor() {
        makeAutoObservable(this)
    }

    // 数据导入
    importData = async (data) => {
        if (!data.overlay) {
            // 清除数据
            this.graphDataMap.clear()
        }
        // 新图则创建对应数据结构
        if (!this.graphDataMap.has(data.name)) {
            this.graphDataMap.set(data.name, new GraphData())
        }

        // 上传文件
        let form = new FormData()
        form.append('node', data.node_table_path[0])
        form.append('edge', data.edge_table_path[0])
        form.append('relation', data.overlay_relation[0])
        const uploadRes = await http.post('/upload', form)
        if(uploadRes.code !== 0){
            message.error('数据上传失败：' + uploadRes.message)
            return false
        }
        data.node_table_path = ''
        data.edge_table_path = ''
        data.overlay_relation = ''

        // 上传其他命令，获取导入结果
        const res = await http.post('/import', data)
        // res是负载data
        if (res.code === 0) {
            message.success('数据导入成功')
            runInAction(() => {
                this.graphBaseInfo = res.data
            })
            return true
        } else {
            message.error('导入失败：' + res.message)
            return false
        }
    }

    // 获取表格数据
    getDataTable = async (data) => {
        const res = await http.post('/get_data_table', data)
        // res是负载data
        if (res.code === 0) {
            message.success('数据获取成功')
            runInAction(() => {
                this.dataTable = res.data
                this.graphDataMap.get(data.name).nodes = data.nodes
                this.graphDataMap.get(data.name).edges = data.edges
            })
        } else {
            message.error('数据获取失败：' + res.message)
        }
        if (typeof res === "string") {

            console.log(res)
            // console.log(JSON.parse(res.replace('NaN','')))
        }

    }

    // 获取可视化数据配置项
    getGraphOption = async (data) => {
        const res = await http.post('/render_network', data)
        // res是负载data
        if (res.code === 0) {
            // message.success('正在加载网络')
            return this.getOptions(res.data)
        } else {
            message.error('网络可视化失败：' + res.message)
        }
        if (typeof res === "string") {
            console.log(res)
            // console.log(JSON.parse(res.replace('NaN','')))
        }
        return null
    }

    // 获取社团发现数据
    getCommunityDetectOption = async (data) => {
        const res = await http.post('/community_detect', data)
        // res是负载data
        if (res.code === 0) {
            // message.success('正在加载网络')
            return this.getOptions(res.data)
        } else {
            message.error('网络可视化失败：' + res.message)
        }
        if (typeof res === "string") {
            console.log(res)
            // console.log(JSON.parse(res.replace('NaN','')))
        }
        return null
    }

    // 获取可视化配置项
    getOptions = (graph) => {
        // 节点较多时启用WebGL布局
        let edgeSymbol = ['none', 'none'];
        if (graph.directed) {
            edgeSymbol = ['none', 'arrow'];
        }
        if (graph.nodes.length >= 20000) {
            graph.nodes.forEach(it => it.symbolSize = it.symbolSize / 3)
            let opt = {
                tooltip: {},
                legend: [
                    //图例
                    {
                        type: "scroll",
                        // orient: 'vertical',
                        // selectedMode: 'single',
                        data: graph.categories.map(function (a) {
                            return a.name;
                        })
                    }
                ],
                animationDuration: 1500,
                animationEasingUpdate: 'quinticInOut',
                series: [
                    {
                        type: 'graphGL',
                        nodes: graph.nodes,
                        edges: graph.edges,


                        categories: graph.categories,

                        roam: true, // 允许缩放和移动画布
                        draggable: true, // 节点可拖动
                        // 节点标签设置
                        label: {
                            show: true,
                            position: 'right',
                            // formatter: '{b}'
                        },
                        labelLayout: {
                            hideOverlap: true, // 重叠时隐藏标签
                        },
                        // 边默认设置
                        edgeSymbol: edgeSymbol, // 边带箭头,可视化有向图
                        lineStyle: {
                            color: 'source', // 边颜色
                            curveness: 0 // 边弯曲程度
                        },
                        itemStyle: {
                            opacity: 1,
                            borderColor: '#fff',
                            borderWidth: 1
                        },
                        // 高亮设置
                        emphasis: {
                            // 鼠标移动上去的高亮效果
                            focus: 'adjacency',
                            lineStyle: {
                                width: 5
                            }
                        },
                        forceAtlas2: {
                            steps: 1,
                            stopThreshold: 0,
                            jitterTolerence: 10,
                            edgeWeight: [0.2, 1],
                            gravity: 5,
                            edgeWeightInfluence: 0,
                            scaling: 0.1,
                            // preventOverlap: true
                        }
                    }
                ]
            }

            return opt
        } else {
            // 节点较少时使用普通布局

            let opt = {
                tooltip: {},
                legend: [
                    //图例
                    {
                        type: "scroll",
                        // orient: 'vertical',
                        // selectedMode: 'single',
                        data: graph.categories.map(function (a) {
                            return a.name;
                        })
                    }
                ],
                animationDuration: 1500,
                animationEasingUpdate: 'quinticInOut',
                series: [
                    {
                        // name: '网络图',
                        type: 'graph',
                        // 布局
                        layout: 'force',
                        force: {
                            repulsion: 1000, // 斥力
                            gravity: 0.1, // 引力
                            edgeLength: 40, // 边长度
                            friction: 0.6, // 动画速度
                        },
                        // 数据
                        data: graph.nodes,
                        links: graph.edges,
                        nodeScaleRatio: 0.7,
                        // edgeSymbolSize:10,
                        categories: graph.categories,

                        roam: true, // 允许缩放和移动画布
                        draggable: true, // 节点可拖动
                        // 节点标签设置
                        label: {
                            show: true,
                            position: 'right',
                            // formatter: '{b}'
                        },
                        labelLayout: {
                            hideOverlap: true, // 重叠时隐藏标签
                        },
                        // 边默认设置
                        edgeSymbol: edgeSymbol, // 边带箭头,可视化有向图
                        lineStyle: {
                            color: 'source', // 边颜色
                            curveness: 0 // 边弯曲程度
                        },
                        itemStyle: {
                            opacity: 1,
                            borderColor: '#fff',
                            borderWidth: 1
                        },
                        // 高亮设置
                        emphasis: {
                            // 鼠标移动上去的高亮效果
                            focus: 'adjacency',
                            lineStyle: {
                                width: 5
                            }
                        }
                    }
                ]
            };

            return opt
        }
    }

    // 获取网络信息
    getGraphInfo = async (data) => {
        const res = await http.post('/get_graph_info', data)
        // res是负载data
        if (res.code === 0) {
            message.success('获取信息成功')
            runInAction(() => {
                this.graphInfo = res.data
                this.graphDataMap.get(data.name).graphInfo = res.data
            })
        } else {
            message.error('获取信息失败：' + res.message)
        }
    }

    // 上传文件
    uploadFile = async (fileName) => {

        const reader = new FileReader()
        reader.readAsArrayBuffer()
        reader.onload = ()=>{
            document.body.innerHTML += reader.result  // reader.result为获取结果
        }

        let data = new FormData()
        data.append('file','file','C:\\Users\\x2845\\Desktop\\地铁边.xlsx')
        http({
            url: '/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            data: data
        }).then(res => {
            console.log(res.data)
        })
        // const res = await http.post('/upload', data)
        // console.log(res)
    }

    get graphCount() {
        return this.graphBaseInfo.graphNames.length
    }

    get graphNameList() {
        return this.graphBaseInfo.graphNames
    }
}

export default GraphStore;
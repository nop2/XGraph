import React, {useContext, useEffect, useRef, useState} from 'react';
import {Button, Card, Divider, Space, Modal, Input, InputNumber, Switch, Select, message} from "antd";
import * as echarts from 'echarts'
import {MinusOutlined, PlusOutlined} from "@ant-design/icons";
import {useStore} from "../../store";

// 写在函数里面变量会被清空
var chart = null


function GraphVis() {
    // graph实例
    const containerRef = useRef(null)
    const {graphStore} = useStore()

    useEffect(() => {
        chart = echarts.init(containerRef.current)
        chart.on('click', params => {
            if (params.componentType === 'series'
                && (params.seriesType === 'graph' || params.seriesType === 'graphGL')) {
                // console.log(params.name)
                // console.log(graphStore.dataTable)
                let info = JSON.stringify(graphStore.dataTable.nodes.data.filter(it => it.key === params.data.id)[0])
                message.info(info)
                // console.log(info)
            }
        })

    }, [])

    const onClick = () => {
        const path = 'https://cdn.jsdelivr.net/gh/apache/echarts-website@asf-site/examples/data-gl/asset/data/npmdep.json'
        fetch(path).then(res => {
            res.json().then((data) => {
                chart.clear()
                console.log(data)
                // return
                var nodes = data.nodes.map(function (nodeName, idx) {
                    return {
                        name: nodeName,
                        value: data.dependentsCount[idx]
                    };
                });
                var edges = [];
                for (var i = 0; i < data.edges.length;) {
                    var s = data.edges[i++];
                    var t = data.edges[i++];
                    edges.push({
                        source: s,
                        target: t
                    });
                }
                nodes.forEach(function (node) {
                    // if (node.value > 100) {
                    node.emphasis = {
                        label: {
                            show: true
                        }
                    };
                    // }
                    if (node.value > 5000) {
                        node.label = {
                            show: true
                        };
                    }
                });

                console.log(chart)
                chart.setOption({
                    backgroundColor: '#000',
                    series: [
                        {
                            color: [
                                'rgb(203,239,15)',
                                'rgb(73,15,239)',
                                'rgb(15,217,239)',
                                'rgb(30,15,239)',
                                'rgb(15,174,239)',
                                'rgb(116,239,15)',
                                'rgb(239,15,58)',
                                'rgb(15,239,174)',
                                'rgb(239,102,15)',
                                'rgb(239,15,15)',
                                'rgb(15,44,239)',
                                'rgb(239,145,15)',
                                'rgb(30,239,15)',
                                'rgb(239,188,15)',
                                'rgb(159,239,15)',
                                'rgb(159,15,239)',
                                'rgb(15,239,44)',
                                'rgb(15,239,87)',
                                'rgb(15,239,217)',
                                'rgb(203,15,239)',
                                'rgb(239,15,188)',
                                'rgb(239,15,102)',
                                'rgb(239,58,15)',
                                'rgb(239,15,145)',
                                'rgb(116,15,239)',
                                'rgb(15,131,239)',
                                'rgb(73,239,15)',
                                'rgb(15,239,131)',
                                'rgb(15,87,239)',
                                'rgb(239,15,231)'
                            ],
                            type: 'graphGL',
                            nodes: nodes,
                            edges: edges,
                            modularity: {
                                resolution: 2,
                                sort: true
                            },
                            lineStyle: {
                                color: 'rgba(255,255,255,1)',
                                opacity: 0.05
                            },
                            itemStyle: {
                                opacity: 1
                                // borderColor: '#fff',
                                // borderWidth: 1
                            },
                            focusNodeAdjacency: false,
                            focusNodeAdjacencyOn: 'click',
                            symbolSize: function (value) {
                                return Math.sqrt(value / 10);
                            },
                            label: {
                                color: '#fff'
                            },
                            emphasis: {
                                label: {
                                    show: false
                                },
                                lineStyle: {
                                    opacity: 0.5,
                                    width: 4
                                }
                            },
                            forceAtlas2: {
                                steps: 5,
                                stopThreshold: 20,
                                jitterTolerence: 10,
                                edgeWeight: [0.2, 1],
                                gravity: 5,
                                edgeWeightInfluence: 0
                                // preventOverlap: true
                            }
                        }
                    ]
                })
            })

        })
    }

    // 改变节点大小
    const changeSymbolSize = (step) => {
        if (chart === null) {
            return
        }
        try {
            let nodes = chart.getOption().series[0].data
            nodes.forEach((node) => {
                node.symbolSize += step;
                if (node.symbolSize < 1) {
                    node.symbolSize = 1;
                }
            });
            let opt = {
                series: {
                    data: nodes,
                    // links: graph.edges
                }
            }
            chart.setOption(opt);
        } catch (e) {
            console.log(e)
        }

    }
    // 改变边的弧度
    const changeEdgeRadian = (value) => {
        let opt = {
            series: {
                lineStyle: {
                    curveness: parseFloat(value) // 边弯曲程度
                }
            }
        }
        chart.setOption(opt);
    }
    // 隐藏标签
    const showLabel = (value) => {
        let opt = {
            series: {
                label: {
                    show: !value,
                },
            }
        }
        chart.setOption(opt);
    }
    // 禁用高亮
    const setHighLight = (value) => {
        let opt = {
            series: {
                emphasis: {
                    // 鼠标移动上去的高亮效果
                    disabled: value,
                    focus: 'adjacency',
                    lineStyle: {
                        width: 5,
                    }
                }
            }
        }
        chart.setOption(opt);
    }
    // 设置斥力
    const changeRepulsion = (value) => {
        let opt = {
            series: {
                force: {
                    repulsion: parseInt(value), // 斥力
                },
            }
        }
        chart.setOption(opt)
    }
    // 设置引力
    const changeGravity = (value) => {
        let opt = {
            series: {
                force: {
                    gravity: parseFloat(value), // 引力
                },
            }
        }
        chart.setOption(opt)

    }
    // 设置边长
    const changeEdgeLength = (value) => {
        let opt = {
            series: {
                force: {
                    edgeLength: parseInt(value), // 边长度
                },
            }
        }
        chart.setOption(opt)

    }
    // 设置动画速度，为0则停止布局
    const changeFriction = (value) => {
        let opt = {
            series: {
                force: {
                    friction: parseFloat(value), // 动画速度
                },
            }
        }
        chart.setOption(opt)

    }

    return (
        <div style={{height: '90vh', backgroundColor: '#fff'}}>
            <div style={{height: '50px', backgroundColor: '#fff', padding: 10}}>
                {/*<Button onClick={onClick}>111</Button>*/}
                <Space align='center'>
                    <Button.Group>
                        <Button>节点大小</Button>
                        <Button onClick={() => changeSymbolSize(5)}><PlusOutlined/></Button>
                        <Button onClick={() => changeSymbolSize(-5)}><MinusOutlined/></Button>
                    </Button.Group>

                    <Button.Group>
                        <Button>边弧度</Button>
                        {/*受控组件*/}
                        <InputNumber onChange={changeEdgeRadian} style={{width: '70px'}} defaultValue={0} min="0"
                                     max="1.0"
                                     step="0.1"></InputNumber>
                    </Button.Group>

                    <Button.Group>
                        <Button>隐藏标签</Button>
                        {/*受控组件*/}
                        <Button>
                            <Switch onChange={showLabel}/>
                        </Button>
                    </Button.Group>

                    <Button.Group>
                        <Button>禁用高亮</Button>
                        {/*受控组件*/}
                        <Button>
                            <Switch onChange={setHighLight}/>
                        </Button>
                    </Button.Group>

                    <Button.Group>
                        <Button>斥力</Button>
                        {/*受控组件*/}
                        <InputNumber onChange={changeRepulsion} defaultValue={1000} min="0" step="100"></InputNumber>
                    </Button.Group>

                    <Button.Group>
                        <Button>引力</Button>
                        {/*受控组件*/}
                        <InputNumber onChange={changeGravity} defaultValue={0.1} min="0" step="0.1"></InputNumber>
                    </Button.Group>

                    <Button.Group>
                        <Button>边长</Button>
                        {/*受控组件*/}
                        <InputNumber onChange={changeEdgeLength} defaultValue={40} min="0" step="5"></InputNumber>
                    </Button.Group>

                    <Button.Group>
                        <Button>速度</Button>
                        {/*受控组件*/}
                        <InputNumber onChange={changeFriction} style={{width: '70px'}} defaultValue={0.6} min="0"
                                     max='1'
                                     step="0.1"></InputNumber>
                    </Button.Group>

                    {/*<Select defaultValue='force' onChange={() => {*/}
                    {/*}}>*/}
                    {/*    <Select.Option value='force'>力导布局</Select.Option>*/}
                    {/*    <Select.Option value='none'>预设布局</Select.Option>*/}
                    {/*</Select>*/}

                </Space>
            </div>
            <Divider style={{margin: 0}}/>
            <div style={{padding: 10, height: '90vh', width: '92vw'}}>
                {/*图表容器*/}
                <div ref={containerRef} style={{height: "100%", width: "100%"}}></div>
            </div>
        </div>

    )
}

export {GraphVis};
export {chart};
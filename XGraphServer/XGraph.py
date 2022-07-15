import math
import os
import random

import igraph as ig
import numpy as np
import pandas as pd


class ColorUtil:
    def __init__(self):
        self.colors = ['#70f3ff', '#44cef6', '#3eede7', '#1685a9', '#177cb0', '#065279', '#003472', '#4b5cc4',
                       '#a1afc9', '#2e4e7e',
                       '#3b2e7e', '#4a4266', '#426666', '#425066', '#574266', '#8d4bbb', '#815463', '#815476',
                       '#4c221b', '#003371',
                       '#56004f', '#801dae', '#4c8dae', '#b0a4e3', '#cca4e3', '#edd1d8', '#e4c6d0', '#ff461f',
                       '#ff2d51', '#f36838',
                       '#ed5736', '#ff4777', '#f00056', '#ffb3a7', '#f47983', '#db5a6b', '#c93756', '#f9906f',
                       '#f05654', '#ff2121',
                       '#f20c00', '#8c4356', '#c83c23', '#9d2933', '#ff4c00', '#ff4e20', '#f35336', '#dc3023',
                       '#ff3300', '#cb3a56',
                       '#a98175', '#b36d61', '#ef7a82', '#ff0097', '#c32136', '#be002f', '#c91f37', '#bf242a',
                       '#c3272b', '#9d2933',
                       '#60281e', '#622a1d', '#bce672', '#c9dd22', '#bddd22', '#afdd22', '#a3d900', '#9ed900',
                       '#9ed048', '#96ce54',
                       '#00bc12', '#0eb83a', '#0eb83a', '#0aa344', '#16a951', '#21a675', '#057748', '#0c8918',
                       '#00e500', '#40de5a',
                       '#00e079', '#00e09e', '#3de1ad', '#2add9c', '#2edfa3', '#7fecad', '#a4e2c6', '#7bcfa6',
                       '#1bd1a5', '#48c0a3',
                       '#549688', '#789262', '#758a99', '#50616d', '#424c50', '#41555d', '#eaff56', '#fff143',
                       '#faff72', '#ffa631',
                       '#ffa400', '#fa8c35', '#ff8c31', '#ff8936', '#ff7500', '#ffb61e', '#ffc773', '#ffc64b',
                       '#f2be45', '#f0c239',
                       '#e9bb1d', '#d9b611', '#eacd76', '#eedeb0', '#d3b17d', '#e29c45', '#a78e44', '#c89b40',
                       '#ae7000', '#ca6924',
                       '#b25d25', '#b35c44', '#9b4400', '#9c5333', '#a88462', '#896c39', '#827100', '#6e511e',
                       '#7c4b00', '#955539',
                       '#845a33', '#ffffff', '#e9e7ef', '#f0f0f4', '#e9f1f6', '#f0fcff', '#e3f9fd', '#d6ecf0',
                       '#fffbf0', '#f2ecde',
                       '#fcefe8', '#fff2df', '#f3f9f1', '#e0eee8', '#e0f0e9', '#c0ebd7', '#bbcdc5', '#c2ccd0',
                       '#bacac6', '#808080',
                       '#75878a', '#88ada6', '#6b6882', '#725e82', '#3d3b4f', '#392f41', '#75664d', '#5d513c',
                       '#665757', '#493131',
                       '#312520', '#161823']

    def value_map(self, nums, target_min, target_max) -> list:
        '''
        将数值映射到另一个区间
        :param nums:
        :param target_min:
        :param target_max:
        :return:
        '''
        x = nums
        if type(nums) is not np.ndarray:
            x = np.array(nums)
        s_min = np.min(x)
        s_max = np.max(x)
        return list(target_min + (target_max - target_min) / (s_max - s_min) * (x - s_min))

    def value2color(self, nums, color_num) -> list:
        '''
        连续值映射为颜色
        :param nums: 值
        :param color_num: 映射的颜色数
        :return:
        '''
        x = self.value_map(nums, 1, color_num)
        colors = random.sample(self.colors, color_num + 1)
        return [colors[math.ceil(c)] for c in x]

    def category2color(self, category) -> list:
        '''
        离散值转颜色
        :param category: 离散数据
        :return:
        '''
        u_c = list(set(category))
        random.shuffle(self.colors)
        color_dict = {}

        i = 0
        color_len = len(self.colors)
        for c in u_c:
            color_dict[c] = self.colors[i]
            i += 1
            if i >= color_len:
                i = color_len - 1

        return [color_dict[c] for c in category]


class XGraph:
    def __init__(self):
        self.color_util = ColorUtil()  # 颜色工具

        self.graph: ig.Graph = None  # 总图对象，复合复杂网络
        self.sub_graph = {}  # 子图对象map,name->{graph,node_data,edge_data}
        self.graph_info_cache = {}

        self.temp_data_table = None  # 从客户端上传的表格文件。如果该变量不为None，则使用该数据，否则直接读取 {node,edge,relation}

    def load(self, name='', file_type: str = 'table', overlay: bool = False, directed: bool = False,
             file_path: str = '',
             node_table_path: str = '', edge_table_path: str = '', overlay_relation: str = '',
             relation_directed: bool = False):
        """
        导入数据，生成网络
        注意：节点数据第一列必须为id，字符串类型，边文件第一列为source，第二列为target


        :param name: 网络名，唯一
        :param file_type: 文件类型：table表格，other其他
        :param overlay:  是否叠加到当前网络
        :param directed:  是否有向图
        :param file_path:  file_type为other时有效
        :param node_table_path: 节点表格，仅file_type=table使有效
        :param edge_table_path:  边表格，仅file_type=table使有效
        :param overlay_relation: 网络叠加时的网络关系表格，仅overlay=true时有效
        :param relation_directed: 网络叠加时的网络关系表格是否有向边，仅overlay=true时有效
        :return:return

        # 前端网络数据导入接口
        load_info = {
            'name': '',  # 图的名字，需要唯一
            'file_type': '',  # 加载的文件类型 'table'为表格
            'overlay': '',  # 叠加到当前网络
            'directed': '',
            'file_path': '',  # type不为数据表格时有效
            'node_table_path': '',  # 节点表格的文件路径
            'edge_table_path': '',  # 边表格的文件路径
            'overlay_relation': '',  # overLay为true时有效
            'relation_directed': ''
        }

        # 加载表格数据，默认第一列是id，字符串类型，如果要叠加网络则必须保证每个文件的id都互不相同
        # 边表前两列必须为为source和target

        """
        if overlay and len(self.sub_graph) == 0:
            raise Exception("未导入网络，无法进行叠加")

        if name in self.sub_graph.keys() and overlay:
            raise Exception('重复的网络名称')

        g: ig.Graph = None
        node_data: pd.DataFrame = None
        edge_data: pd.DataFrame = None
        relation_data: pd.DataFrame = None

        if file_type == 'table':
            # 已经通过上传导入数据
            if self.temp_data_table is not None:
                node_data = self.temp_data_table['node']
                edge_data = self.temp_data_table['edge']
                relation_data = self.temp_data_table['relation']
            else:
                # 根据文件名手动导入数据
                if node_table_path != '' and os.path.exists(node_table_path):
                    node_data = self.read_table(node_table_path)

                if os.path.exists(edge_table_path):
                    edge_data = self.read_table(edge_table_path)
                else:
                    raise Exception('边文件不存在')

                if overlay and os.path.exists(overlay_relation):
                    relation_data = self.read_table(overlay_relation)

                if node_data is None and edge_data is None:
                    raise '文件都为空'

                if node_data is None:
                    # 只有边文件，先生成所有节点
                    node_data = pd.DataFrame()
                    node_data['__id__'] = list(
                        set(edge_data[edge_data.columns[0]].astype(str)
                            + edge_data[edge_data.columns[1]].astype(str)))

            g = ig.Graph(directed=directed)
            # 修改name名称，防止重名
            node_data.columns = [f'_name' if col == 'name' else col for col in node_data.columns]

            col_names = node_data.columns
            node_id = node_data[col_names[0]].astype(str)
            # 添加节点
            for i, row in node_data.iterrows():
                kw = {col: row[col] for col in col_names[1:]}  # 其他数据
                g.add_vertex(name=node_id[i], **kw)
                # 点网络叠加操作
                if overlay and len(self.sub_graph) >= 1:
                    kw['__graph_name__'] = name  # 再复合网络中标记网络名
                    if self.graph is None:
                        self.graph = ig.Graph(directed=directed)
                    self.graph.add_vertex(name=node_id[i], **kw)

            # 添加边
            attributes = {col: edge_data[col] for col in edge_data.columns[2:]}
            edges = zip(edge_data[edge_data.columns[0]].astype(str), edge_data[edge_data.columns[1]].astype(str))
            g.add_edges(edges, attributes=attributes)

            # 边网络叠加操作
            if overlay and len(self.sub_graph) >= 1:
                # TODO:有向图和无向图混合操作，先不处理，尽量保证同一类型
                # if directed:
                #     pass

                # 向复合网络对象添加边
                # 这里变量需要重新算，不然无法添加边
                attributes = {col: edge_data[col] for col in edge_data.columns[2:]}
                attributes['__graph_name__'] = [name] * edge_data.shape[0]  # 记录边所在网络
                edges = zip(edge_data[edge_data.columns[0]].astype(str), edge_data[edge_data.columns[1]].astype(str))
                self.graph.add_edges(edges, attributes=attributes)

                # 叠加网络关系边
                if relation_data is not None:
                    attributes = {col: relation_data[col] for col in relation_data.columns[2:]}
                    attributes['__graph_name__'] = ['__none__'] * relation_data.shape[0]
                    edges = zip(relation_data[relation_data.columns[0]].astype(str),
                                relation_data[relation_data.columns[1]].astype(str))
                    self.graph.add_edges(edges, attributes=attributes)

                self.sub_graph[name] = {
                    'graph': g,
                    'node_data': node_data,
                    'edge_data': edge_data,
                    'option': None
                }

            if not overlay:
                # 非网络叠加操作，清理数据
                self.graph: ig.Graph = g.copy()
                self.graph.vs.set_attribute_values(attrname='__graph_name__', values=[name] * self.graph.vcount())
                self.graph.es.set_attribute_values(attrname='__graph_name__', values=[name] * self.graph.ecount())
                self.sub_graph = {name: {
                    'graph': g,
                    'node_data': node_data,
                    'edge_data': edge_data,
                    'option': None
                }}

            # 清理上传的数据
            self.temp_data_table = None

    def get_data_table(self, name='') -> dict:
        '''
        获取网络对应的表格数据
        :param name: 网络名
        :return: json格式数据

        # data = {
        #     'columns': [{
        #         'title': 'a',
        #         'dataIndex': 'a'
        #     }, ],
        #     'data': [
        #         {
        #             'key': '1',
        #             'a': 44,
        #         }
        #     ],
        # }
        '''
        # print(name)

        if name not in self.sub_graph.keys():
            raise Exception('网络不存在')

        nodes: pd.DataFrame = self.sub_graph[name]['node_data']
        edges: pd.DataFrame = self.sub_graph[name]['edge_data']

        return {
            'nodes': self.__get_json_form_df(nodes),
            'edges': self.__get_json_form_df(edges)
        }

    def __get_json_form_df(self, df: pd.DataFrame) -> dict:
        data = {
            'columns': [{'title': col, 'dataIndex': col} for col in df.columns],
            'data': []
        }
        for i, row in df.iterrows():
            item = {
                'key': str(row[0])
            }
            for col in df.columns:
                if type(row[col]) is np.int64:
                    item[col] = int(row[col])
                elif type(row[col]) is np.nan or pd.isna(row[col]):
                    item[col] = ''
                else:
                    item[col] = row[col]
            data['data'].append(item)
        return data

    def get_graph_info(self, name='') -> dict:
        '''
        获取网络基本属性值
        :param name: 网络名，如果为空则选定复合网络
        :return:

        '''

        g = self.graph
        if name != '':
            g = self.sub_graph[name]['graph']

        data = {
            'directed': g.is_directed(),
            'connected': g.is_connected(),
            'nodeCount': g.vcount(),
            'edgeCount': g.ecount(),
            'degree': g.degree(),  # 数组
            'maxDegree': g.maxdegree(),
            'averageDegree': round(np.average(g.degree()), 4),
            'diameter': g.diameter(),
            'averagePathLen': round(g.average_path_length(), 4),
            'globalClusteringCoefficient': round(g.transitivity_undirected(), 4),  # 全局聚集系数
            'density': round(g.density(), 4),  # 网络密度

            'betweenness': [-1 if np.isnan(v) else round(v, 6) for v in
                            g.betweenness()],  # 介数
            'closeness': [-1 if np.isnan(v) else round(v, 6) for v in g.closeness()],  # 紧密中心度
            'pageRank': [-1 if np.isnan(v) else round(v, 6) for v in
                         g.pagerank()],  # pagerank
        }

        self.graph_info_cache[name] = data
        # self.graph_info_cache[name]['betweenness'] = [-1 if np.isnan(v) else round(v, 6) for v in
        #                                               g.betweenness()],  # 介数
        # self.graph_info_cache[name]['closeness'] = [-1 if np.isnan(v) else round(v, 6) for v in g.closeness()],  # 紧密中心度
        # self.graph_info_cache[name]['pageRank'] = [-1 if np.isnan(v) else round(v, 6) for v in
        #                                            g.pagerank()],  # pagerank
        return data

    def render_network(self, name='', vertex_size='_度_', vertex_color='_随机_', vertex_label='_默认_',
                       vertex_shape='circle') -> dict:
        '''
        获取网络节点、边可视化数据
        :param vertex_shape:
        :param vertex_label:
        :param vertex_color:
        :param vertex_size:
        :param name: 网络名
        :return:
        '''

        if name == '_':  # 复合网络可视化
            g = self.graph
            # 要求已经可视化过所有子网

            for gname in self.sub_graph.keys():
                if self.sub_graph[gname]['option'] is None:
                    raise Exception(f'需要先可视化{gname}')

            # 生成节点和边数据
            nodes = []
            edges = []

            # 网络名，用于图例筛选
            categories = []
            graph_index_map = {}
            i = 0
            for n in self.sub_graph.keys():
                categories.append({
                    "name": n
                })
                graph_index_map[n] = i
                i += 1

            for v in g.vs:
                # v: ig.Vertex
                graph_name = v['__graph_name__']
                option = self.sub_graph[graph_name]['option']
                item = {
                    "id": str(v['name']),  # id 字符串
                    "name": str(option['vertex_label'][v['name']]),  # label
                    "value": '',  # 额外信息
                    "symbol": option['vertex_shape'],  # 形状
                    "symbolSize": option['vertex_size'][v['name']],  # 节点大小
                    "itemStyle": {  # 节点颜色
                        "color": option['vertex_color'][v['name']],
                    },
                    "category": graph_index_map[graph_name]
                }
                nodes.append(item)

            for e in g.es:
                # e: ig.Edge
                item = {
                    'source': str(g.vs[e.source]['name']),
                    'target': str(g.vs[e.target]['name']),
                }
                if e['__graph_name__'] == '__none__':  # 网络关系文件
                    item['lineStyle'] = {
                        "color": "red",
                        "width": 4,
                        "type": "dashed",
                    }
                edges.append(item)

            return {
                "nodes": nodes,
                "edges": edges,
                "categories": categories,
                "directed": g.is_directed()
            }

        # 可视化子图

        # 子图的图例，如果颜色为节点属性，则将图例设置为该属性
        categories = [{"name": name}]
        color_index_map = None  # 为None则不生效

        if name != '':
            g = self.sub_graph[name]['graph']

        if name in self.graph_info_cache.keys():
            info = self.graph_info_cache[name]
        else:
            info = self.get_graph_info()

        label_flag = False
        size_flag = False
        # 计算节点样式
        if type(vertex_size) is not dict:
            print(type(vertex_size))
            size_flag = True
            print(size_flag)
            if vertex_size != '':
                if vertex_size == '_默认_':
                    vertex_size = [20] * info['nodeCount']
                elif vertex_size == "_度_":
                    vertex_size = [int(10 + d * 4) for d in self.color_util.value_map(info['degree'], 1, 20)]
                elif vertex_size == "_介数_":
                    vertex_size = [int(10 + d * 4) for d in self.color_util.value_map(info['betweenness'], 1, 20)]
                elif vertex_size == "_紧密中心度_":
                    vertex_size = [int(10 + d * 4) for d in self.color_util.value_map(info['closeness'], 1, 20)]
                else:
                    if vertex_size in g.vs.attribute_names():

                        try:
                            x = np.array(g.vs.get_attribute_values(vertex_size))
                            vertex_size = [int(10 + d * 4) for d in self.color_util.value_map(x, 1, 10)]
                        except Exception as e:
                            vertex_size = [20] * info['nodeCount']
            else:
                vertex_size = [20] * info['nodeCount']

        if type(vertex_color) is not list:
            if vertex_color != '':
                if vertex_color.startswith('#'):
                    # vertex_color = [f"#{vertex_color.split('#')[-1]}"] * self.vertex_count
                    # vertex_color = [random.choice(self.colors)] * self.vertex_count
                    vertex_color = [vertex_color] * info['nodeCount']
                elif vertex_color == "_随机_":
                    colors = random.sample(self.color_util.colors, 20)
                    vertex_color = [random.choice(colors) for _ in range(info['nodeCount'])]
                elif vertex_color == "_度_":
                    vertex_color = self.color_util.value2color(info['degree'], 10)
                elif vertex_color == "_介数_":
                    vertex_color = self.color_util.value2color(info['betweenness'], 10)
                elif vertex_color == "_紧密中心度_":
                    vertex_color = self.color_util.value2color(info['closeness'], 10)
                else:
                    if vertex_color in g.vs.attribute_names():
                        attr = g.vs.get_attribute_values(vertex_color)

                        try:
                            x = np.array(attr)
                            vertex_color = self.color_util.value2color(x, 10)
                        except Exception as e:
                            vertex_color = self.color_util.category2color(attr)
                            # 属性值为离散类型，此时可以更新图例，颜色映射到下标
                            color_cat_map = {}
                            categories = []
                            color_index_map = {}
                            for i in range(len(attr)):
                                color_cat_map[vertex_color[i]] = attr[i]

                            i = 0
                            for k, v in color_cat_map.items():
                                categories.append({
                                    "name": v,
                                    "itemStyle": {
                                        "color": k
                                    }
                                })
                                color_index_map[k] = i
                                i += 1
            else:
                vertex_color = [random.choice(self.color_util.colors)] * info['nodeCount']

        if type(vertex_label) is not dict:
            label_flag = True
            if vertex_label == "_默认_":
                if 'name' in g.vs.attribute_names():
                    vertex_label = [str(i) for i in g.vs.get_attribute_values('name')]
                else:
                    vertex_label = [str(i) for i in range(info['nodeCount'])]
            else:
                if vertex_label in g.vs.attribute_names():
                    vertex_label = [str(i) for i in g.vs.get_attribute_values(vertex_label)]
                else:
                    vertex_label = [str(i) for i in range(info['nodeCount'])]

        # 生成节点和边数据
        nodes = []
        edges = []

        # x,y坐标
        # has_pos = False
        # if 'x' in g.vs.attribute_names() and 'y' in g.vs.attribute_names():
        #     has_pos = True
        #     xpos = g.vs.get_attribute_values('x')
        #     ypos = g.vs.get_attribute_values('y')

        nodes = [{
            "id": str(v['name']),  # id 字符串
            "index": v.index,
            "name": str(vertex_label[v.index]) if label_flag else str(vertex_label[v['name']]),  # label
            "value": '',  # 额外信息
            "symbol": vertex_shape,  # 形状
            "symbolSize": vertex_size[v.index] if size_flag else vertex_size[v['name']],  # 节点大小
            "itemStyle": {  # 节点颜色
                "color": vertex_color[v.index],
            },
            'category': 0 if color_index_map is None else color_index_map[vertex_color[v.index]],
            # 'x': xpos[v.index] if has_pos else 0,
            # 'y': ypos[v.index] if has_pos else 0,

        } for v in g.vs]

        for e in g.es:
            # e: ig.Edge
            item = {
                'source': str(g.vs[e.source]['name']),
                'target': str(g.vs[e.target]['name']),
            }

            edges.append(item)

        # for v in g.vs:
        #     # v: ig.Vertex
        #     item = {
        #         "id": str(v.index),  # id 字符串
        #         "name": str(vertex_label[v.index]),  # label
        #         "value": '',  # 额外信息
        #         "symbol": vertex_shape,  # 形状
        #         "symbolSize": vertex_size[v.index],  # 节点大小
        #         "itemStyle": {  # 节点颜色
        #             "color": vertex_color[v.index],
        #         }
        #     }
        #     nodes.append(item)

        if name != '_':
            # 更新option信息
            self.sub_graph[name]['option'] = {
                'vertex_size': {v['name']: vertex_size[v.index] if size_flag else vertex_size[v['name']] for v in g.vs},
                'vertex_shape': vertex_shape,
                'vertex_label': {v['name']: str(vertex_label[v.index]) if label_flag else str(vertex_label[v['name']])
                                 for v in g.vs},
                'vertex_color': {v['name']: vertex_color[v.index] for v in g.vs},
            }

        return {
            "nodes": nodes,
            "edges": edges,
            "categories": categories,
            "directed": g.is_directed()
        }

    def community_detect(self, name='', method=''):
        '''
        社团发现
        :param name: 图名称
        :param method:  社团发现算法
        :return:
        '''

        if name not in self.sub_graph.keys():
            raise Exception('网络不存在')

        g = self.sub_graph[name]['graph']

        community_detect_algorithm_dict = {
            'EdgeBetweenness': g.community_edge_betweenness,  # 速度慢
            'FastGreedy': g.community_fastgreedy,  # 不能有重复边
            'LabelPropagation': g.community_label_propagation,
            'MultiLevel': g.community_multilevel,
            'SpinGlass': g.community_spinglass,  # 速度慢
            'WalkTrap': g.community_walktrap
        }

        community: [ig.VertexDendrogram, ig.VertexClustering] = community_detect_algorithm_dict[method]()
        # count = community.optimal_count  # 社团数量

        if type(community) is ig.VertexClustering:
            vertex_community = community.membership
        else:
            vertex_community = community.as_clustering().membership  # 节点所在社团

        vertex_colors = self.color_util.category2color(vertex_community)

        option = self.sub_graph[name]['option']
        if option is None:
            return self.render_network(name=name, vertex_color=vertex_colors)
        else:
            return self.render_network(name=name, vertex_color=vertex_colors, vertex_size=option['vertex_size'],
                                       vertex_label=option['vertex_label'], vertex_shape=option['vertex_shape'])

    @staticmethod
    def read_table(file_path: str) -> pd.DataFrame:
        '''
        读取表格文件
        :param file_path:
        :return:
        '''
        data = None
        try:
            if file_path.endswith('.csv'):
                data = pd.read_csv(file_path)
            else:
                data = pd.read_excel(file_path)
        except:
            raise

        return data


def build_success(data: dict = None, msg=''):
    return {
        'code': 0,
        'message': msg,
        'data': data
    }


def build_error(msg: str, code=-1, data=None):
    return {
        'code': code,
        'message': msg,
        'data': data
    }


def build_response(code: int, data, msg: str = ''):
    return {
        'code': code,
        'message': msg,
        'data': data
    }

import cherrypy

from common.page_info import PageInfoMain
from common.session import Sessions

class IndexController:
    def __init__(self, templates, es, ps, cache):
        self.t = templates
        self.ps = ps
        self.params = (es, ps)

    def Index(self):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/index', **pageInfo.wholePage(True))

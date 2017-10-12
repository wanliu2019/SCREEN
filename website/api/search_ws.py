from __future__ import print_function

import os, sys, json
import time
import cherrypy

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from config import Config
from cre_utils import checkChrom
from parse_search import ParseSearch
from pg_cart import PGcart

class SearchWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeWS(assembly):
            return SearchWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.wss = {a : makeWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[j["assembly"]].process(j, args, kwargs)

class SearchWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly

        self.actions = {"search" : self.search}
        
    def process(self, j, args, uuid):
        action = args[0]
        try:
            return self.actions[action](j, args[1:], uuid)
        except:
            raise

    def search(self, j, args, uuid):
        chrom = checkChrom(self.assembly, j)

        parsed = ""
        if "q" in j:
            p = ParseSearch(self.ps.DBCONN, self.assembly, j)
            parsed = p.parse()
            if j["q"] and not p.haveresults(parsed):
                ret["failed"] = j["q"]

        cart = PGcart(self.ps, self.assembly)
        accessions = cart.get(uuid)

        parsed["cart_accessions"] = accessions
        if "cart" in j:
            parsed["accessions"] = accessions

        ret = {"parsedQuery" : parsed,
               "globalSessionUid" : uuid}
        return ret
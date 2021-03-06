#!/usr/bin/python

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


import sys
import io
import cherrypy
import json
import os

from models.cre import CRE
from models.trackhubdb import TrackhubDb
from common.pg_search import PGsearch
from common.db_trackhub import DbTrackhub
from common.coord import Coord


class TrackhubController:
    def __init__(self, pw, cacheW):
        self.pw = pw
        self.cacheW = cacheW
        self.db = DbTrackhub(self.pw)

    def ucsc_trackhub(self, *args, **kwargs):
        tdb = TrackhubDb(self.pw, self.cacheW, self.db)
        return tdb.ucsc_trackhub(*args, **kwargs)

    def _trackhub_url_info(self, j):
        assembly = self.assembly = j["assembly"]
        pgSearch = PGsearch(self.pw, assembly)

        if "coord_start" not in j:
            cre = CRE(pgSearch, j["accession"], self.cacheW[assembly])
            coord = cre.coord()
        else:
            coord = Coord(j["coord_chrom"], j["coord_start"], j["coord_end"])
        coord.resize(j["halfWindow"])

        return assembly, j["accession"], coord

    def ucsc_trackhub_url(self, j, uuid):
        assembly, accession, coord = self._trackhub_url_info(j)
        hubNum = self.db.insertOrUpdate(assembly, accession, uuid, j)

        c = Coord(j["coord_chrom"], j["coord_start"], j["coord_end"])

        trackhubUrl = '/'.join([j["host"],
                                "ucsc_trackhub",
                                uuid,
                                "hub_" + str(hubNum) + ".txt"])

        url = "https://genome.ucsc.edu/cgi-bin/hgTracks?"
        url += "db=" + assembly
        url += "&position=" + str(coord)
        url += "&hubClear=" + trackhubUrl
        url += "&highlight=" + assembly + "." + c.chrom + "%3A" + str(c.start) + '-' + str(c.end)

        if "hg19" == assembly:
            url += "&g=wgEncodeGencodeV19"
            url += "&g=phastCons100way"

        if "mm10" == assembly:
            # FIXME
            pass

        return {"url": url, "trackhubUrl": trackhubUrl}

    def ucsc_trackhub_url_snp(self, j, uuid):
        assembly = self.assembly = j["assembly"]
        pgSearch = PGsearch(self.pw, assembly)

        snp = j["snp"]
        c = Coord(snp["chrom"], snp["cre_start"], snp["cre_end"])

        hubNum = self.db.insertOrUpdate(assembly, snp["accession"], uuid, j)

        trackhubUrl = '/'.join([j["host"],
                                "ucsc_trackhub",
                                uuid,
                                "hub_" + str(hubNum) + ".txt"])

        url = "https://genome.ucsc.edu/cgi-bin/hgTracks?"
        url += "db=" + assembly
        url += "&position=" + str(c)
        url += "&hubClear=" + trackhubUrl
        url += "&highlight=" + assembly + "." + c.chrom + "%3A" + str(snp["snp_start"]) + '-' + str(snp["snp_end"])

        if "hg19" == assembly:
            url += "&g=wgEncodeGencodeV19"
            url += "&g=phastCons100way"

        return {"url": url, "trackhubUrl": trackhubUrl}

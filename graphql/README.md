# Quick Start
To setup and start the server:

    yarn
    yarn start

You can now navigate to *localhost:4000/graphql* in your browser and run graphql queries.

# Schema
The schema is written using graphql-js objects. In order to download the raw graphql language schema, do the following:

If you haven't downloaded graphql-cli yet:

    npm install -g graphql-cli
    echo "{schemaPath: schema.graphql, extensions: { endpoints: { dev: http://localhost:4000/graphql } } }" > .graphqlconfig


Once you have graphql-cli installed, start the graphql server (as in Quick Start) and run:

    graphql get-schema

The downloaded schema will now be in *schema.graphql*.

# Examples
You can copy these into the graphiql window to check out example queries for different web services. Click the *Execute Query* button at the top and choose an action. The results will be displayed on the right.

Document (on left):
```
query credetails {
  credetails(accessions: ["EH37E0321285"]) {
    info {
      range {
        chrom
        start
        end
      }
      ctspecific {
        ct
        dnase_zscore
        promoter_zscore
        enhancer_zscore
        ctcf_zscore
      }
    }
    miniPeaks
  }
}

query snpSearch(
  $assembly: Assembly!,
  $uuid: UUID!
) {
  search(assembly: $assembly, uuid: $uuid, search: {q:"rs146546272 rs111996173"}) {
    __typename
    ... on SNPToken {
      snp {
        id
        range {
          chrom
          start
          end
        }
      }
    }
  }
}

query complicatedsearch(
  $assembly: Assembly!,
  $uuid: UUID!,
) {
  # Search will try to parse tokens as best as possible
  search(assembly: $assembly, uuid: $uuid, search: {q: "GAPDH chr1 K562 1 rs10742583 100 chr2 2-101 chr3 1 A549 ethanol chr4:1 50 EH37E1090133 "}) {
    __typename
    input
    ... on RangeToken {
      range {
        chrom
        start
        end
      }
    }
    # Since we searched a range, we won't get back an AccessionsResponse
    ... on AccessionToken {
      accession
    }

    ... on CellTypeToken {
      celltype
    }

    ... on MultiGeneToken {
      genes {
        approved_symbol
      }
    }

    ... on SingleGeneToken {
      gene {
         approved_symbol
      }
    }

    ... on SNPToken {
      snp {
        id
      }
    }

    ... on UnknownToken {
      failed
    }
  }
}

query rangeSearchAndData(
  $assembly: Assembly!,
  $uuid: UUID!,
  $rangeSearch: SearchParameters!,
  $dataRange: DataParameters!,
  $dataCellType: DataParameters!
) {
  search(assembly: $assembly, uuid: $uuid, search: $rangeSearch) {
    __typename
    ... on RangeToken {
      range {
        chrom
        start
        end
      }
    }
    # Since we searched a range, we won't get back an AccessionsResponse
    ... on AccessionToken {
      accession
    }
  }
  # We can search by a range
  dataSearch: data(assembly: $assembly, uuid: $uuid, data: $dataRange) {
    total,
    rfacets,
    cres{
      accession
    }
  }
  # Or, we can refine our search. In this case, by cell type "K562"
  dataSearchRefined: data(assembly: $assembly, uuid: $uuid, data: $dataCellType) {
    total
    cres {
      k4me3max
      range {
        chrom,
        start,
        end
      }
      ctspecific {
        ct
        dnase_zscore
        promoter_zscore
        enhancer_zscore
        ctcf_zscore
      }
    }
  },
}

query geneSearch(
  $assembly: Assembly!,
  $uuid: UUID!,
  $geneSearch: SearchParameters!,
) {
  search(assembly: $assembly, uuid: $uuid, search: $geneSearch) {
    __typename
    # We searched for a gene, so this should be empty
    ... on RangeToken {
      range {
        chrom
        start
        end
      }
    }
    ... on SingleGeneToken {
      gene {
        approved_symbol,
        sm
        range {
          chrom
          start
          end
        }
      }
    }
  }
}

query dataWithPagination(
  $assembly: Assembly!,
  $uuid: UUID!,
  $dataRangeChr: DataParameters!,
  $pagination: PaginationParameters
) {
  # We can also paginate. We can return up to 1000 cREs for the first 10000
	dataPagination: data(assembly: $assembly, uuid: $uuid, , data: $dataRangeChr, pagination: $pagination) {
    total,
    cres {
      accession
    }
  }
}

query desearch {
  de_search(assembly: mm10, gene: "Kremen1", ct1: "C57BL/6_limb_embryo_11.5_days", ct2: "C57BL/6_limb_embryo_15.5_days") {
    coord {
      chrom
      start
      end
    },
    diffCREs,
    nearbyDEs,
    xdomain
  }
}

query suggestions($suggestionSearch: String!, $assemblies: [Assembly]){
  suggestions(query: $suggestionSearch, assemblies: $assemblies) {
    suggestions
  }
}

query geneExpresssion {
  geneExpresssion(assembly: GRCh38, gene: "GAPDH", biosample_types: ["tissue"], compartments: ["cell"]) {
    coords {
      chrom
      start
      end
      strand
    },
    gene,
    ensemblid_ver,
    itemsByRID,
    mean,
    single
  }
}

query gwas {
  gwas(assembly: GRCh38){
		gwas,
    study(study: "Lesch_18839057_ADHD"),
    cres(study: "Lesch_18839057_ADHD", cellType: "angular_gyrus_female_adult_75_years")
  }
}

query getCart($uuid: UUID!) {
  get_cart(uuid: $uuid) {
    accessions
  }
}

query carttable(
    $assembly: Assembly!,
    $uuid: UUID!,
    $dataquery: DataParameters!
)
{
    data(assembly: $assembly, uuid: $uuid, data: $dataquery) {
  		...allcredata
    }
}

fragment allcredata on Data {
  total,
	rfacets,
  cres {
    assembly
    accession
    dnasemax
    ctcfmax
    k27acmax
    k4me3max
    concordant
    isproximal
    range {
        chrom
        start
        end
    }
    maxz
    ctspecific {
        ct
        dnase_zscore
        promoter_zscore
        enhancer_zscore
        ctcf_zscore
    }

    nearbygenes {
        pc
        all
    }
  }
}
    
query gb($gbrange: InputChromRange!) {
  gb(assembly: GRCh38) {
    trackhubs,
    genetable(range: $gbrange)
  }
}

query trackhuburl($uuid: UUID!, $info: UCSCTrackhubInfo!) {
  ucsc_trackhub_url (uuid: $uuid, info: $info) {
    trackhuburl,
    url
  }
}

mutation SetCart($uuid: UUID!) {
  set_cart(uuid: $uuid, accessions: ["EH37E1090133", "EH37E0204932"]) {
    accessions
  }
}

query globals($assembly: Assembly!) {
  globals {
    helpKeys,
    byAssembly(assembly: $assembly){
      tfs
    }
  }
}

```

Query Variables (below Document):
```
{
  "assembly": "GRCh38",
  "uuid": "59060ce0-6462-4498-990a-4e0e48844163",
  "dataRange": {
    "range": {
      "chrom": "chr1",
      "start": 5,
      "end": 5000000
    }
  },
  "dataRangeChr": {
    "range": {
      "chrom": "chr1"
    }
  },
  "dataCellType": {
    "range": {
      "chrom": "chr1",
      "start": 5,
      "end": 5000000
    },
    "cellType": "K562"
  },
  "rangeSearch": {
    "q": "chr1:5-5000000"
  },
  "geneSearch": {
    "q": "GAPDH"
  },
  "pagination": {
    "offset": 500,
    "limit": 3
  },
  "gbrange": {
    "chrom": "chr11",
    "start": 1,
    "end": 5000000
  },
  "info": {
    "accession": "EH37E1090133",
    "assembly": "GRCh38",
    "cellTypes": [
      "A549"
    ],
    "range": {
      "chrom": "chr11",
      "end": 5248621,
      "start": 5247589
    },
    "halfWindow": 7500,
    "showCombo": true
  },
  "suggestionSearch": "ga"
}
```

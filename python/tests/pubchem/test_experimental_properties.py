"""Flatten Experimental Properties into heading + citation[]; catalog sources without page."""
from __future__ import annotations

from pathlib import Path

from pubchem.experimental_value import ExperimentalCitation, ExperimentalProperty, ExperimentalQuantity
from pubchem.parsers.experimental_properties import (
    canonicalize_source, citation_ref_code, depositor_ref_code, normalize_source, page_of,
    parse_experimental, parse_quantities, preferred_ref_code, strip_page,
)
from pubchem.pubchem_records_writer import append_pubchem_record, compact_pubchem_files
from pubchem.pubchem_references import read_pubchem_references, register_sources
from pubchem.pubchem_view import PubchemView
from pubchem_fixtures import pubchem_record

_CRC = (
    "Lide, D.R. CRC Handbook of Chemistry and Physics 88TH Edition 2007-2008. "
    "CRC Press, Taylor & Francis, Boca Raton, FL 2007, p. 4-57"
)
_CRC_OTHER = (
    "Haynes, W.M. (ed.). CRC Handbook of Chemistry and Physics 88TH Edition 2007-2008. "
    "CRC Press, Boca Raton, FL 2007, p. 4-57"
)
_MERCK = "O'Neil, M.J. (ed.). The Merck Index - An Encyclopedia of Chemicals. Cambridge, 2013., p. 396"
_Q = ExperimentalQuantity


def _body() -> dict:
    return {
        "Record": {
            "RecordNumber": 62750,
            "Reference": [{
                "ReferenceNumber": 24, "SourceName": "Hazardous Substances Data Bank (HSDB)",
                "SourceID": "7906", "Name": "X", "Description": "Long HSDB essay — must not be stored",
                "URL": "https://example.test/hsdb", "ANID": 99, "IsToxnet": True,
            }],
            "Section": [{"TOCHeading": "Experimental Properties", "Section": [
                {"TOCHeading": "Melting Point", "Information": [{
                    "ReferenceNumber": 24,
                    "Description": "PEER REVIEWED",
                    "Reference": [_CRC, _MERCK],
                    "Value": {"StringWithMarkup": [{"String": "342.3 °C"}]},
                }]},
            ]}],
        },
    }


class TestParseQuantities:
    def test_keeps_original_and_splits_spec_number_unit(self):
        text = "Red: Triple point = 590 °C; sublimation point = 431 °C"
        assert parse_quantities(text) == [
            _Q(590.0, "°C", "Red: Triple point"),
            _Q(431.0, "°C", "sublimation point"),
        ]

    def test_range_shares_unit(self):
        assert parse_quantities("100-120 °C") == [_Q(100.0, "°C"), _Q(120.0, "°C")]

    def test_comma_thousands_and_fahrenheit(self):
        assert parse_quantities("MP: 1,605 °C") == [_Q(1605.0, "°C", "MP")]
        assert parse_quantities("1517 °F") == [_Q(1517.0, "°F")]

    def test_density_unit(self):
        assert parse_quantities("7.23 g/cm³") == [_Q(7.23, "g/cm³")]

    def test_no_quantity(self):
        assert parse_quantities("white") == []


class TestCanonicalSource:
    def test_page_tail_is_a_locator(self):
        sax = ("Lewis, R.J. Sr. (ed) Sax's Dangerous Properties of Industrial Materials. "
               "11th Edition. Wiley-Interscience, Wiley & Sons, Inc. Hoboken, NJ. 2004., : 870")
        bare = sax.replace(", : 870", "")
        assert canonicalize_source(sax) == (canonicalize_source(bare)[0], "870")
        kirk = ("Kirk-Othmer Encyclopedia of Chemical Technology. 4th ed. Volumes 1: New York, NY. "
                "John Wiley and Sons, 1991-Present., : 73 (1997)")
        assert canonicalize_source(kirk)[1] == "73"
        assert canonicalize_source("… 1978., /231")[1] == "231"
        doe = ("U.S. Department of Energy; Guide of Good Practices for Occupational Radiological "
               "Protection in Plutonium Facilities. p 2-17 DOE-STD-1128-98 (1998)")
        other = doe.replace("p 2-17 ", "p 2-6 ")
        assert canonicalize_source(doe)[0] == canonicalize_source(other)[0]
        assert canonicalize_source(doe)[1] == "2-17"

    def test_database_drops_the_chemical(self):
        one = ("NOAA; CAMEO Chemicals. Database of Hazardous Materials. Vanadium Trioxide (1314-34-7). "
               "Natl Ocean Atmos Admin. Available from, as of April 8, 2016: https://cameochemicals.noaa.gov/")
        two = one.replace("Vanadium Trioxide (1314-34-7)", "Vanadium Oxide (1314-62-1)")
        assert canonicalize_source(one) == canonicalize_source(two)
        assert canonicalize_source(one)[0].startswith("NOAA; CAMEO Chemicals")
        chris = ("U.S. Coast Guard, Department of Transportation. CHRIS - Hazardous Chemical Data. (1999). "
                 "Available from, as of Sept 22, 2009: https://cameochemicals.noaa.gov/chris/CMO.pdf")
        assert "CAMEO" not in canonicalize_source(chris)[0]

    def test_same_article_ignores_coverage_years(self):
        first = ("Hoffman JE, King MG; Kirk-Othmer Encyclopedia of Chemical Technology. (1999-2011). "
                 "New York, NY: John Wiley & Sons; Selenium and Selenium Compounds. "
                 "Online Posting Date: February 22, 2011")
        second = first.replace("(1999-2011)", "(2010)").replace("New York, NY", "NY, NY")
        other = first.replace("Selenium and Selenium Compounds", "Sulfur Compounds")
        assert canonicalize_source(first) == canonicalize_source(second) == canonicalize_source(other)
        assert canonicalize_source(first)[0] == "Kirk-Othmer Encyclopedia of Chemical Technology."

    def test_pmid_and_merck_editions_stay_apart(self):
        assert canonicalize_source("PMID:6376602")[0] != canonicalize_source("PMID:11563639")[0]
        merck_1996 = ("Budavari, S. (ed.). The Merck Index - An Encyclopedia of Chemicals, Drugs, "
                      "and Biologicals. Whitehouse Station, NJ: Merck and Co., Inc., 1996")
        merck_2001 = merck_1996.replace("1996", "2001")
        assert normalize_source(canonicalize_source(merck_1996)[0]) != normalize_source(
            canonicalize_source(merck_2001)[0])
        kirk = ("Kirk-Othmer Encyclopedia of Chemical Technology. 4th ed. Volumes 1: New York, NY. "
                "John Wiley and Sons, 1991-Present")
        paged = kirk + "., 689 (1995)"
        assert normalize_source(canonicalize_source(kirk)[0]) == normalize_source(canonicalize_source(paged)[0])
        assert canonicalize_source(paged)[1] == "689"
        volume_1 = "Fenaroli's Handbook of Flavor Ingredients. Volume 1. 2nd ed. Cleveland: The Chemical Rubber Co., 1975"
        volume_2 = volume_1.replace("Volume 1", "Volume 2")
        assert canonicalize_source(volume_1)[0] == canonicalize_source(volume_2)[0]
        assert canonicalize_source(volume_1)[1] == "1"
        sax_11 = "Sax, N.I. Dangerous Properties of Industrial Materials. 11th ed. Hoboken, NJ. 2004"
        sax_12 = sax_11.replace("11th", "12th").replace("2004", "2012")
        assert normalize_source(canonicalize_source(sax_11)[0]) != normalize_source(
            canonicalize_source(sax_12)[0])
        assert normalize_source("Atkinson R et al; Atmos Chem Phys 6") != normalize_source(
            "Atkinson R et al; Atmos Chem Phys 8")
        monograph_1 = "Atkinson R; J Phys Chem Ref Data Monograph 1 (1989)"
        monograph_2 = "Atkinson R; J Phys Chem Ref Data Monograph 2 (1994)"
        assert normalize_source(canonicalize_source(monograph_1)[0]) != normalize_source(
            canonicalize_source(monograph_2)[0])
        hydrocarbons = "Kirk-Othmer Encyclopedia of Chemical Technology. Hydrocarbons C1-C6"
        assert normalize_source(hydrocarbons) == normalize_source(hydrocarbons.replace("C1-C6", ", C1-C6"))
        perry_ny = "Perry RH, Green D; Perry's Chemical Handbook. Physical and Chemical Data. NY, NY: McGraw-Hill 6th ed (1984)"
        perry_full = "Perry RH, Green D; Perry's Chemical Handbook. Physical and Chemical Data. 6th ed., New York, NY: McGraw Hill (1984)"
        perry_engineer = "Perry RH, Green D; Perry's Chemical Engineer's Handbook 6th ed New York, NY: McGraw-Hill, Inc (1984)"
        assert canonicalize_source(perry_ny)[0] == canonicalize_source(perry_full)[0] == canonicalize_source(perry_engineer)[0]
        ullmann_article = "Ullmann's Encyclopedia of Industrial Chemistry. 7th ed. Charcoal"
        ullmann_other = "Ullmann's Encyclopedia of Industrial Chemistry. 7th ed. Sulfur"
        ullmann_5 = ("Gerhartz, W. (exec ed.). Ullmann's Encyclopedia of Industrial Chemistry. "
                     "5th ed.Vol A1: Deerfield Beach, FL: VCH Publishers, 1985 to Present")
        assert canonicalize_source(ullmann_article)[0] == canonicalize_source(ullmann_other)[0]
        assert canonicalize_source(ullmann_5)[0] != canonicalize_source(ullmann_article)[0]
        hawley_ny = "Hawley's Condensed Chemical Dictionary. 13th ed. New York, NY: John Wiley & Sons, Inc. 1997"
        hawley_short = "Hawley's Condensed Chemical Dictionary. 13th ed. NY, NY: John Wiley & Sons, 1997"
        assert normalize_source(hawley_ny) == normalize_source(hawley_short)

    def test_niosh_publication_numbers_stay_apart(self):
        earlier = "NIOSH Pocket Guide … Publication No. 2005-151 (2005)"
        later = "NIOSH. NIOSH Pocket Guide to Chemical Hazards. Publication No. 2005-149 (2005)"
        assert "2005-151" in canonicalize_source(earlier)[0]
        assert "2005-149" in canonicalize_source(later)[0]
        short = "NIOSH. NIOSH Pocket Guide to Chemical Hazards. Publication No. 97-140 (1997)"
        other = short.replace("97-140", "94-116")
        assert canonicalize_source(short)[0] != canonicalize_source(other)[0]
        assert preferred_ref_code("NIOSHNIOSHPocketGuide-2005-2", later) == "NIOSHNIOSHPocketGuide-2005-149"
        assert preferred_ref_code("NIOSHNIOSHPocketGuide-2010", earlier.replace("2005-151", "2010-168")) == (
            "NIOSHNIOSHPocketGuide-2010-168")

    def test_year_edition_and_volume_groups(self):
        perrin = ("Perrin DD; Dissociation constants of organic bases in aqueous solution. "
                  "IUPAC Chem Data Ser, Buttersworth, London (1965)")
        perrin_spelling = ("Perrin DD; Dissociation Constants of Organic Bases in Aqueous Solution, "
                           "IUPAC Chemical Data Series. London, UK: Buttersworth (1965)")
        perrin_1972 = ("Perrin DD; Dissociation Constants of Organic Bases in Aqueous Solution. "
                       "IUPAC Chem Data Ser: Suppl 1972 Buttersworth, London, (1972)")
        assert canonicalize_source(perrin)[0] == canonicalize_source(perrin_spelling)[0]
        assert canonicalize_source(perrin)[0].endswith("(1965)")
        assert canonicalize_source(perrin)[0] != canonicalize_source(perrin_1972)[0]
        assert canonicalize_source(
            "Perrin DD; Dissociation Constants of Organic Bases in Aqueous Solution. "
            "London: Buttersworth & Co p 197 (1965)")[1] == "197"

        merck_2001 = ("Budavari, S. (ed.). The Merck Index - An Encyclopedia of Chemicals, Drugs, "
                      "and Biologicals. Whitehouse Station, NJ: Merck and Co., Inc., 2001")
        merck_13 = ("O'Neil, M.J. (ed.). The Merck Index - An Encyclopedia of Chemicals, Drugs, "
                    "and Biologicals. 13th ed, Whitehouse Station, NJ: Merck and Co., Inc., 2001")
        merck_short = "MERCK INDEX (1996)"
        merck_1996 = ("Budavari, S. (ed.). The Merck Index - An Encyclopedia of Chemicals, Drugs, "
                      "and Biologicals. Whitehouse Station, NJ: Merck and Co., Inc., 1996")
        assert canonicalize_source(merck_2001)[0] == canonicalize_source(merck_13)[0]
        assert canonicalize_source(merck_short)[0] == canonicalize_source(merck_1996)[0]
        assert canonicalize_source(merck_2001)[0] != canonicalize_source(merck_1996)[0]

        monograph = "Atkinson R; J Phys Chem Ref Data Monograph 1 (1989)"
        monograph_no = "Atkinson R; J Phys Chem Ref Data Monograph No. 1 (1989)"
        monograph_1994 = "Atkinson R; J Phys Chem Ref Data Mongraph No. 2 (1994)"
        assert canonicalize_source(monograph)[0] == canonicalize_source(monograph_no)[0]
        assert canonicalize_source(monograph)[0] != canonicalize_source(monograph_1994)[0]
        journal = "Atkinson R; Journal of Physical and Chemical Reference Data. Monograph 2 (1994)"
        assert canonicalize_source(journal)[0] == canonicalize_source(monograph_1994)[0]

        fenaroli = "Burdock, G.A. (ed.). Fenaroli's Handbook of Flavor Ingredients. 6th ed.Boca Raton, FL 2010"
        fenaroli_short = ("Burdock GA, ed; Fenaroli's Handbook of Flavor Ingredients. "
                          "6th ed. Boca Raton, FL: CRC Press, (2010)")
        assert canonicalize_source(fenaroli)[0] == canonicalize_source(fenaroli_short)[0]
        assert canonicalize_source(fenaroli)[0] != canonicalize_source(fenaroli.replace("6th", "5th"))[0]

        yaws_3 = ("Yaws CL; Handbook of Vapor Pressure. Vol 3: C8-C28 Compounds. "
                  "Houston, TX: Gulf Pub Co, (1994)")
        yaws_3_other = ("Yaws Cl; Handbook of Vapor Pressure. Volume 3 - C8 to C28 Compounds. "
                        "Houston, TX: Gulf Publishing Co. (1994)")
        yaws_1 = "Yaws CL; Handbook of Vapor Pressure. Vol 1: C1-C4 Compounds. Houston, TX: Gulf Pub Co (1994)"
        assert canonicalize_source(yaws_3)[0] == canonicalize_source(yaws_3_other)[0]
        assert canonicalize_source(yaws_3)[0] != canonicalize_source(yaws_1)[0]

        assert canonicalize_source("http://foodb.ca/compounds/FDB015439") == (
            "http://foodb.ca/compounds", "FDB015439")
        assert canonicalize_source("http://foodb.ca/compounds/FDB015440")[0] == "http://foodb.ca/compounds"

        ambrose_8 = "Ambrose D et al; J Chem Therm 8"
        ambrose_full = "Ambrose D et al; J Chem Thermodyn 8"
        assert canonicalize_source(ambrose_8)[0] == canonicalize_source(ambrose_full)[0]
        assert canonicalize_source(ambrose_8)[0].endswith("(1976)")
        assert canonicalize_source(ambrose_8)[0] != canonicalize_source("Ambrose D et al; J Chem Therm 7")[0]

        daubert = ("Daubert, T.E., R.. Physical and Thermodynamic Properties of Pure Chemicals "
                   "Data Compilation. Washington, D.C.: Taylor and Francis, 1989")
        daubert_full = ("Daubert TE, Danner RP; Physical and Thermodynamic Properties of Pure Chemicals "
                        "Data Compilation. Washington, DC: Taylor and Francis (1989)")
        dippr = ("Daubert TE, Danner RP; Physical and Thermodynamic Properties of Pure Chemicals: "
                 "Data Compilation. Design Institute for Physical Property Data. New York, NY: "
                 "Hemisphere Pub Corp (1999)")
        assert canonicalize_source(daubert)[0] == canonicalize_source(daubert_full)[0]
        assert canonicalize_source(daubert)[0] != canonicalize_source(daubert.replace("1989", "1995"))[0]
        assert "Design Institute" in canonicalize_source(dippr)[0]

        pesticide = ("MacBean C, ed; e-Pesticide Manual. 15th ed., ver. 5.1, Alton, UK; "
                     "British Crop Protection Council. Zinc phosphide (1314-84-7) (2008-2010)")
        other_chemical = pesticide.replace("Zinc phosphide (1314-84-7)", "Aluminum phosphide (20859-73-8)")
        assert canonicalize_source(pesticide)[0] == canonicalize_source(other_chemical)[0]
        assert canonicalize_source(pesticide)[0].endswith("British Crop Protection Council.")
        assert canonicalize_source(pesticide)[1] == "Zinc phosphide (1314-84-7)"

        hsdb = "National Library of Medicine HSDB Database"
        assert canonicalize_source(hsdb)[0] == canonicalize_source("MSDS, " + hsdb)[0]

        assert canonicalize_source("http://www.chemspider.com/Chemical-Structure.10654.html") == (
            "http://www.chemspider.com", "Chemical-Structure.10654.html")
        assert canonicalize_source("https://pubchem.ncbi.nlm.nih.gov/compound/Magnesium#section=Odor")[0] == (
            "https://pubchem.ncbi.nlm.nih.gov/")
        assert canonicalize_source("http://www.inchem.org/documents/icsc/icsc/eics0951.htm")[0] == (
            "http://www.inchem.org")
        assert canonicalize_source(
            "# http://www.chemicalbook.com/ProductChemicalPropertiesCB3852587_EN.htm")[0] == (
            "https://www.chemicalbook.com/")

        yaws_106 = "Yaws CL et al; Chem Eng; 106: 102-105 (1999)"
        assert canonicalize_source(yaws_106) == ("Yaws CL et al; Chem Eng 106 (1999)", "102-105")
        assert canonicalize_source("Yaws CL et al; Chem Eng 97")[0] == "Yaws CL et al; Chem Eng 97 (1990)"
        assert canonicalize_source("Yaws CL et al; Chem Eng; 106")[0] != canonicalize_source(
            "Yaws CL et al; Chem Eng 97")[0]

        vaporization = ("Zwolinski BJ, Wilhoit RC; Handbook of Vapor Pressures and Heats of Vaporization "
                        "of Hydrocarbons and related compounds. API44-TRC101 (1971)")
        formation = ("Zwolinski BJ, Wilhoit RC; Handbook of Vapor Pressures and Heats of Formation "
                     "of Hydrocarbons and Related Compounds. API44-TRC101 (1971)")
        assert canonicalize_source(vaporization)[0] == canonicalize_source(formation)[0]

        fenaroli_volume = ("Fenaroli's Handbook of Flavor Ingredients. Volume 1. Edited, translated, "
                           "and revised by T.E. Furia and N. Bellanca. 2nd ed. Cleveland: "
                           "The Chemical Rubber Co., 1975")
        assert canonicalize_source(fenaroli_volume) == ("Fenaroli's Handbook of Flavor Ingredients.", "1")
        assert canonicalize_source(fenaroli_volume.replace("Volume 1", "Volume 2")) == (
            "Fenaroli's Handbook of Flavor Ingredients.", "2")

        atmos = ("Atkinson R et al; Atmos Chem Phys 8: 4141-96 (2008). Available, as of March 31, 2016: "
                 "https://www.atmos-chem-phys.net/special_issue8.html")
        assert canonicalize_source(atmos) == ("Atkinson R et al; Atmos Chem Phys 8", "4141-96")
        assert canonicalize_source("Atkinson R et al; Atmos Chem Phys 8")[0] == canonicalize_source(atmos)[0]
        assert canonicalize_source("Atkinson R et al; Atmos Chem Phys 6")[0] != canonicalize_source(atmos)[0]

        betterton = ("Betterton EA; in Gaseous Pollutants: Characterization and Cycling, Nriagu JO, Ed. "
                     "John Wiley & Sons, Inc. (1992)")
        betterton_short = "Betterton EA; Gaseous Pollutants. New York, NY: John Wiley and Sons, Inc. (1992)"
        assert canonicalize_source(betterton)[0] == canonicalize_source(betterton_short)[0]

        phosphorus = "Patty's Toxicology. Phosphorus, Selenium, Tellurium, and Sulfur"
        boron = "Patty's Toxicology. 6th ed. Boron"
        fifth = ("Bingham, E.; Cohrssen, B.; Powell, C.H.; Patty's Toxicology Volumes 1-9 5th ed. "
                 "John Wiley & Sons. New York, N.Y. (2001)")
        assert canonicalize_source(phosphorus)[0] == canonicalize_source(boron)[0] == "Patty's Toxicology. 6th ed."
        assert canonicalize_source(fifth)[0] == "Patty's Toxicology. 5th ed."
        assert canonicalize_source(fifth)[0] != canonicalize_source(boron)[0]
        assert canonicalize_source(fifth)[1] == "Volumes 1-9"

        borax = ("Tomlin CDS, ed. Borax (1303-96-4). In: The e-Pesticide Manual, 13th ed Version 3.0 "
                 "(2003-04). Surrey UK, British Crop Protection Council")
        chlorate = ("Tomlin CDS, ed. Sodium chlorate (7775-09-9). In: The e-Pesticide Manual, "
                    "13th ed Version 3.1 (2004-05). Surrey UK, British Crop Protection Council")
        sulfamate = ("Tomlin CDS, ed. Ammonium sulfamate (7773-06-0). In: The e-Pesticide Manual, "
                     "Version 2.2 (2002). Surrey UK, British Crop Protection Council")
        assert canonicalize_source(borax)[0] == "The e-Pesticide Manual, 13th ed Version 3.0"
        assert canonicalize_source(chlorate)[0] == "The e-Pesticide Manual, 13th ed Version 3.1"
        assert canonicalize_source(borax)[0] != canonicalize_source(chlorate)[0]
        assert canonicalize_source(sulfamate)[0] == "The e-Pesticide Manual, Version 2.2"
        assert canonicalize_source(chlorate)[1] == "Sodium chlorate (7775-09-9)"


class TestParseExperimental:
    def test_stem_has_no_page_or_hash(self):
        assert citation_ref_code(_CRC) == "CRCHandbook-ed88-2007"
        assert citation_ref_code(_MERCK) == "MerckIndex-2013"
        assert depositor_ref_code("Hazardous Substances Data Bank (HSDB)", "6341") == "HSDB-6341"

    def test_parse_groups_citations_under_heading(self):
        properties, refs = parse_experimental(_body(), 62750)
        qty = (_Q(342.3, "°C"),)
        merck = "The Merck Index - An Encyclopedia of Chemicals, Drugs, and Biologicals. 2013"
        assert properties == [
            ExperimentalProperty("Melting Point", (
                ExperimentalCitation("342.3 °C", qty, "CRCHandbook-ed88-2007", None, "4-57", strip_page(_CRC)),
                ExperimentalCitation("342.3 °C", qty, "MerckIndex-2013", None, "396", merck),
            )),
        ]
        assert {r["refCode"] for r in refs} == {"CRCHandbook-ed88-2007", "MerckIndex-2013"}
        assert all("page" not in r and "p. 4-57" not in r["source"] for r in refs)

    def test_register_assigns_index_and_disambiguates_stem(self, tmp_path: Path):
        path = tmp_path / "pubchem-references.jsonl"
        properties, pending = parse_experimental(_body(), 1)
        pending.append({
            "refCode": "CRCHandbook-ed88-2007", "source": strip_page(_CRC_OTHER),
        })
        updated, new_rows = register_sources(path, properties, pending)
        assert [r["refNumber"] for r in new_rows] == [1, 2, 3]
        assert {r["refCode"] for r in new_rows} == {
            "CRCHandbook-ed88-2007", "MerckIndex-2013", "CRCHandbook-ed88-2007-2",
        }
        assert all("page" not in r for r in new_rows)
        cite = updated[0].citation[0]
        assert cite.ref_number == 1 and cite.ref_code == "CRCHandbook-ed88-2007"
        assert cite.ref_page == "4-57" and cite.source is None
        assert cite.to_json() == {
            "text": "342.3 °C",
            "values": [{"number": 342.3, "unit": "°C"}],
            "refCode": "CRCHandbook-ed88-2007", "refNumber": 1, "refPage": "4-57",
        }
        multi = parse_quantities("Red: Triple point = 590 °C; sublimation point = 431 °C")
        assert [q.to_json() for q in multi] == [
            {"spec": "Red: Triple point", "number": 590.0, "unit": "°C"},
            {"spec": "sublimation point", "number": 431.0, "unit": "°C"},
        ]

    def test_depositor_only(self):
        body = {
            "Record": {
                "Reference": [{"ReferenceNumber": 1, "SourceName": "CAMEO Chemicals", "SourceID": "8234",
                               "URL": "https://example.test/cameo"}],
                "Section": [{"TOCHeading": "Color", "Information": [
                    {"ReferenceNumber": 1, "Value": {"StringWithMarkup": [{"String": "white"}]}}]}],
            },
        }
        properties, refs = parse_experimental(body, 1)
        assert properties[0].citation[0].ref_code == "CAMEO-8234"
        assert properties[0].citation[0].text == "white"
        assert properties[0].citation[0].values == ()
        assert properties[0].citation[0].source.startswith("NOAA; CAMEO Chemicals")
        assert refs[0]["refCode"] == "CAMEO-8234"
        assert refs[0]["source"].startswith("NOAA; CAMEO Chemicals")

    def test_empty_body(self):
        assert parse_experimental(None, 1) == ([], [])

    def test_page_helper(self):
        assert page_of("… p. 4-57") == "4-57"
        assert strip_page(_CRC).endswith("2007") and "4-57" not in strip_page(_CRC)


class TestSlimStorage:
    def test_append_writes_citation_and_catalog_without_source_on_value(self, tmp_path: Path):
        view = PubchemView.from_experimental_response(62750, "2026-10-14T10:00:00+00:00", 200, "https://x", _body())
        record = pubchem_record("12182-83-1", "inorganic", [{"CID": 62750, "MolecularFormula": "X"}],
                                experimental=(view,))
        path = tmp_path / "pubchem-inorganic.jsonl"
        append_pubchem_record(path, record)
        line = path.read_text(encoding="utf-8")
        assert '"citation":' in line
        assert '"text": "342.3 °C"' in line
        assert '"number": 342.3' in line and '"unit": "°C"' in line
        assert '"refCode": "CRCHandbook-ed88-2007"' in line
        assert '"refNumber": 1' in line
        assert '"refPage": "4-57"' in line
        assert _CRC[:40] not in line
        assert "a1b2c3d4" not in line and "Long HSDB essay" not in line
        refs = read_pubchem_references(tmp_path / "pubchem-references.jsonl")
        assert refs["CRCHandbook-ed88-2007"]["refNumber"] == 1
        assert "page" not in refs["CRCHandbook-ed88-2007"]
        assert "p. 4-57" not in refs["CRCHandbook-ed88-2007"]["source"]
        assert refs["MerckIndex-2013"]["refNumber"] == 2
        append_pubchem_record(path, record)
        assert len(read_pubchem_references(tmp_path / "pubchem-references.jsonl")) == 2
        assert compact_pubchem_files([path]) == 1  # second compound line superseded; refs keep numbers

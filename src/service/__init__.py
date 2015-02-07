import importlib


def get_service_by_name(service_name):
    module = importlib.import_module("service.%s.provider" % service_name)
    return module.get_service()
